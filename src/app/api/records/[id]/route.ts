import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.record.findUnique({
      where: { id: params.id },
      include: {
        case: {
          include: {
            disease: true,
            orchard: {
              include: {
                location: true,
                variety: true
              }
            }
          }
        },
        orchard: {
          include: {
            location: true,
            variety: true
          }
        }
      }
    })

    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 })
    }

    return Response.json(record)
  } catch (error) {
    console.error('Error fetching record:', error)
    return Response.json({ error: 'Failed to fetch record' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { caseId, orchardId, recordedAt, numberOfTreesChecked, numberOfTreesInfected } = body

    const updatedRecord = await prisma.record.update({
      where: { id: params.id },
      data: {
        caseId,
        orchardId,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,
        numberOfTreesChecked,
        numberOfTreesInfected
      },
      include: {
        case: {
          include: {
            disease: true,
            orchard: {
              include: {
                location: true,
                variety: true
              }
            }
          }
        },
        orchard: {
          include: {
            location: true,
            variety: true
          }
        }
      }
    })

    return Response.json(updatedRecord)
  } catch (error) {
    console.error('Error updating record:', error)
    return Response.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.record.delete({
      where: { id: params.id }
    })

    return Response.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Error deleting record:', error)
    return Response.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}