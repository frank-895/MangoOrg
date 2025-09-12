import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    const whereClause = caseId ? { caseId } : {}

    const records = await prisma.record.findMany({
      where: whereClause,
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
      },
      orderBy: {
        recordedAt: 'desc'
      }
    })

    return Response.json(records)
  } catch (error) {
    console.error('Error fetching records:', error)
    return Response.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, orchardId, recordedAt, numberOfTreesChecked, numberOfTreesInfected } = body

    const newRecord = await prisma.record.create({
      data: {
        caseId,
        orchardId,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
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

    return Response.json(newRecord)
  } catch (error) {
    console.error('Error creating record:', error)
    return Response.json({ error: 'Failed to create record' }, { status: 500 })
  }
}