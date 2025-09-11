import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      include: {
        disease: true,
        orchard: {
          include: {
            location: true,
            variety: true
          }
        },
        records: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(cases)
  } catch (error) {
    console.error('Error fetching cases:', error)
    return Response.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { diseaseId, orchardId, status, partOfPlant } = body

    const newCase = await prisma.case.create({
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

    return Response.json(newCase)
  } catch (error) {
    console.error('Error creating case:', error)
    return Response.json({ error: 'Failed to create case' }, { status: 500 })
  }
}