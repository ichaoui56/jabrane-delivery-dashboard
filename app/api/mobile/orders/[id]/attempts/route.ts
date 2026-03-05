import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return jsonError("ID de commande invalide", 400)
    }
    
    // Vérifier que la commande appartient à ce livreur
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deliveryManId: deliveryMan.id,
      }
    })
    
    if (!order) {
      return jsonError("Commande non trouvée ou non autorisée", 404)
    }
    
    // Récupérer toutes les tentatives de livraison pour cette commande
    const deliveryAttempts = await prisma.deliveryAttempt.findMany({
      where: {
        orderId: orderId,
      },
      orderBy: {
        attemptNumber: 'desc'
      },
      include: {
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    })
    
    // Formater la réponse avec des statuts en français
    const formattedAttempts = deliveryAttempts.map(attempt => {
      // Convertir le statut de la base de données en français
      let frenchStatus: "TENTATIVE" | "ÉCHEC" | "RÉUSSIE" | "CLIENT_INDISPONIBLE" | "ADRESSE_ERRONÉE" | "REFUSÉ" | "AUTRE"
      
      switch (attempt.status) {
        case "ATTEMPTED":
          frenchStatus = "TENTATIVE"
          break
        case "FAILED":
          frenchStatus = "ÉCHEC"
          break
        case "SUCCESSFUL":
          frenchStatus = "RÉUSSIE"
          break
        case "CUSTOMER_NOT_AVAILABLE":
          frenchStatus = "CLIENT_INDISPONIBLE"
          break
        case "WRONG_ADDRESS":
          frenchStatus = "ADRESSE_ERRONÉE"
          break
        case "REFUSED":
          frenchStatus = "REFUSÉ"
          break
        case "OTHER":
          frenchStatus = "AUTRE"
          break
        default:
          frenchStatus = "TENTATIVE"
      }
      
      return {
        id: attempt.id,
        orderId: attempt.orderId,
        attemptNumber: attempt.attemptNumber,
        deliveryManId: attempt.deliveryManId,
        attemptedAt: attempt.attemptedAt.toISOString(),
        status: frenchStatus,
        reason: attempt.reason,
        notes: attempt.notes,
        location: attempt.location,
        deliveryMan: attempt.deliveryMan ? {
          id: attempt.deliveryMan.id,
          name: attempt.deliveryMan.user.name,
          phone: attempt.deliveryMan.user.phone,
        } : null
      }
    })
    
    return jsonOk({ 
      attempts: formattedAttempts,
      count: formattedAttempts.length 
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des tentatives de livraison:", error)
    return jsonError("Échec de la récupération des tentatives de livraison", 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return jsonError("ID de commande invalide", 400)
    }
    
    const body = await request.json()
    const { status, reason, notes, location } = body
    
    // Valider le statut
    const validStatuses = ["DELAYED", "REJECTED", "CANCELLED", "DELIVERED"]
    if (!validStatuses.includes(status)) {
      return jsonError("Statut invalide", 400)
    }
    
    // Vérifier si la commande existe et appartient au livreur
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deliveryManId: deliveryMan.id,
      },
      include: {
        deliveryAttemptHistory: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
        }
      }
    })
    
    if (!order) {
      return jsonError("Commande non trouvée ou non autorisée", 404)
    }
    
    // Calculer le numéro de la prochaine tentative
    const lastAttempt = order.deliveryAttemptHistory[0]
    const nextAttemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1
    
    // Mapper le statut frontend vers le statut de tentative
    let attemptStatus: "ATTEMPTED" | "FAILED" | "SUCCESSFUL" | "CUSTOMER_NOT_AVAILABLE" | "WRONG_ADDRESS" | "REFUSED" | "OTHER"
    
    switch (status) {
      case "DELIVERED":
        attemptStatus = "SUCCESSFUL"
        break
      case "DELAYED":
        // Mapper les raisons courantes vers des statuts de tentative spécifiques
        if (reason?.includes("non disponible") || reason?.includes("ne répond pas")) {
          attemptStatus = "CUSTOMER_NOT_AVAILABLE"
        } else if (reason?.includes("adresse") || reason?.includes("Adresse")) {
          attemptStatus = "WRONG_ADDRESS"
        } else if (reason?.includes("Refusé") || reason?.includes("refusé")) {
          attemptStatus = "REFUSED"
        } else {
          attemptStatus = "OTHER"
        }
        break
      case "REJECTED":
      case "CANCELLED":
        attemptStatus = "FAILED"
        break
      default:
        attemptStatus = "OTHER"
    }
    
    // Démarrer une transaction pour mettre à jour la commande et créer la tentative
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la commande
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
          updatedAt: new Date(),
        }
      })
      
      // Créer un enregistrement de tentative de livraison
      const deliveryAttempt = await tx.deliveryAttempt.create({
        data: {
          orderId: orderId,
          attemptNumber: nextAttemptNumber,
          deliveryManId: deliveryMan.id,
          status: attemptStatus,
          reason: reason || null,
          notes: notes || null,
          location: location || null,
          attemptedAt: new Date(),
        }
      })
      
      return { updatedOrder, deliveryAttempt }
    })
    
    // Messages de succès en français
    let successMessage = ""
    switch (status) {
      case "DELIVERED":
        successMessage = "Commande marquée comme livrée avec succès"
        break
      case "DELAYED":
        successMessage = "Retard enregistré. La commande reste en cours."
        break
      case "CANCELLED":
      case "REJECTED":
        successMessage = "Commande annulée avec succès"
        break
      default:
        successMessage = "Statut de la commande mis à jour"
    }
    
    return jsonOk({
      success: true,
      message: successMessage,
      order: {
        id: result.updatedOrder.id,
        orderCode: result.updatedOrder.orderCode,
        status: result.updatedOrder.status,
        attemptNumber: result.deliveryAttempt.attemptNumber,
      }
    })
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la commande:", error)
    return jsonError("Échec de la mise à jour du statut de la commande", 500)
  }
}