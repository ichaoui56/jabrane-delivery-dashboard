import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

// DELETE - Remove a note (only the creator can delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    const noteId = Number.parseInt(params.noteId, 10)
    
    if (!Number.isFinite(orderId) || !Number.isFinite(noteId)) {
      return jsonError("Invalid ID", 400)
    }

    // Find the note
    const note = await prisma.deliveryNote.findUnique({
      where: { id: noteId },
      include: {
        order: {
          select: {
            id: true,
            deliveryManId: true,
            cityId: true,
          }
        }
      }
    })

    if (!note) {
      return jsonError("Note not found", 404)
    }

    if (note.orderId !== orderId) {
      return jsonError("Note does not belong to this order", 400)
    }

    // Check access to order
    const deliveryManWithCity = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      include: { city: true }
    })

    if (!deliveryManWithCity) {
      return jsonError("Unauthorized", 401)
    }

    const sameCity = (deliveryManWithCity.cityId || null) === note.order.cityId
    const assignedToMe = note.order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    // Check if the delivery man is the creator of the note
    if (note.deliveryManId !== deliveryMan.id) {
      return jsonError("You can only delete your own notes", 403)
    }

    // Delete the note
    await prisma.deliveryNote.delete({
      where: { id: noteId }
    })

    return jsonOk({ 
      success: true,
      message: "Note deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting note:", error)
    return jsonError("Internal server error", 500)
  }
}

// PUT - Update a note (only the creator can update)
export async function PUT(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    const noteId = Number.parseInt(params.noteId, 10)
    
    if (!Number.isFinite(orderId) || !Number.isFinite(noteId)) {
      return jsonError("Invalid ID", 400)
    }

    const body = await request.json()
    const { content, isPrivate } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return jsonError("Note content is required", 400)
    }

    if (content.trim().length > 1000) {
      return jsonError("Note content is too long (max 1000 characters)", 400)
    }

    // Find the note
    const note = await prisma.deliveryNote.findUnique({
      where: { id: noteId },
      include: {
        order: {
          select: {
            id: true,
            deliveryManId: true,
            cityId: true,
          }
        }
      }
    })

    if (!note) {
      return jsonError("Note not found", 404)
    }

    if (note.orderId !== orderId) {
      return jsonError("Note does not belong to this order", 400)
    }

    // Check access to order
    const deliveryManWithCity = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      include: { city: true }
    })

    if (!deliveryManWithCity) {
      return jsonError("Unauthorized", 401)
    }

    const sameCity = (deliveryManWithCity.cityId || null) === note.order.cityId
    const assignedToMe = note.order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    // Check if the delivery man is the creator of the note
    if (note.deliveryManId !== deliveryMan.id) {
      return jsonError("You can only update your own notes", 403)
    }

    // Update the note
    const updatedNote = await prisma.deliveryNote.update({
      where: { id: noteId },
      data: {
        content: content.trim(),
        isPrivate: isPrivate !== undefined ? isPrivate : note.isPrivate,
      },
      include: {
        deliveryMan: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    })

    return jsonOk({ 
      success: true,
      message: "Note updated successfully",
      note: updatedNote 
    })
  } catch (error) {
    console.error("Error updating note:", error)
    return jsonError("Internal server error", 500)
  }
}

