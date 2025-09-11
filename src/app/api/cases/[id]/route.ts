import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        disease: true,
        orchard: {
          include: {
            location: true,
            variety: true
          }
        },
        records: {
          orderBy: {
            recordedAt: 'desc'
          }
        }
      }
    })

    if (!case_) {
      return Response.json({ error: 'Case not found' }, { status: 404 })
    }

    return Response.json(case_)
  } catch (error) {
    console.error('Error fetching case:', error)
    return Response.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { diseaseId, orchardId, status, partOfPlant } = body

    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        diseaseId,
        orchardId,
        status,
        partOfPlant
      },
      include: {
        disease: true,
        orchard: {
          include: {
            location: true,
            variety: true
          }
        },
        records: true
      }
    })

    return Response.json(updatedCase)
  } catch (error) {
    console.error('Error updating case:', error)
    return Response.json({ error: 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.case.delete({
      where: { id: params.id }
    })

    return Response.json({ message: 'Case deleted successfully' })
  } catch (error) {
    console.error('Error deleting case:', error)
    return Response.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}