export interface Disease {
  id: string
  name: string
  type: 'DISEASE' | 'PEST'
  severity?: number | null
  spreadability?: number | null
  shortDescription?: string | null
  longDescription?: string | null
  controlMethod?: string | null
  imageLink?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateDiseaseData {
  name: string
  type: 'DISEASE' | 'PEST'
  severity?: number
  spreadability?: number
  shortDescription?: string
  longDescription?: string
  controlMethod?: string
  imageLink?: string
}

export interface UpdateDiseaseData extends Partial<CreateDiseaseData> {
  id: string
}

export interface Profile {
  id: string
  userId: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
}
