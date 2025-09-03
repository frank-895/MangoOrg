import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env and .env.local
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase: any = null

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

async function uploadSeedImage(imagePath: string, fileName: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(imagePath)
    const fileExtension = path.extname(fileName)
    const timestamp = Date.now()
    const uniqueFileName = `seed/${timestamp}-${fileName}`

    const { data, error } = await supabase.storage
      .from('disease-images')
      .upload(uniqueFileName, fileBuffer, {
        contentType: `image/${fileExtension.slice(1)}`,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload ${fileName}: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('disease-images')
      .getPublicUrl(uniqueFileName)

    console.log(`✅ Uploaded ${fileName} to ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error)
    throw error
  }
}

// Disease data template
const diseaseData = [
  {
    id: 'anthracnose-disease-001',
    name: 'Anthracnose',
    type: 'DISEASE' as const,
    severity: 8,
    spreadability: 7,
    shortDescription: 'A fungal disease that causes dark, sunken lesions on leaves, stems, and fruits.',
    longDescription: 'Anthracnose is a serious fungal disease caused by Colletotrichum gloeosporioides that affects mango trees worldwide. It manifests as dark, sunken lesions on leaves, stems, flowers, and fruits. The disease thrives in warm, humid conditions and can cause significant yield losses. Symptoms include circular to angular brown spots on leaves, black lesions on stems, and sunken spots on fruits that may develop into rot. The fungus can survive in infected plant debris and spread through rain splash and wind.',
    controlMethod: 'Cultural control: Remove and destroy infected plant debris, maintain proper tree spacing for air circulation, and avoid overhead irrigation. Chemical control: Apply copper-based fungicides or mancozeb during flowering and fruit development. Biological control: Use beneficial fungi like Trichoderma spp. as soil amendments. Preventive measures: Regular pruning to improve air circulation and applying fungicides before rainy seasons.',
    placeholderImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop'
  },
  {
    id: 'mango-fruit-fly-001',
    name: 'Mango Fruit Fly',
    type: 'PEST' as const,
    severity: 9,
    spreadability: 8,
    shortDescription: 'A destructive pest that lays eggs in mango fruits, causing internal damage and premature fruit drop.',
    longDescription: 'The mango fruit fly (Bactrocera dorsalis) is one of the most destructive pests of mango trees. Adult flies lay eggs in developing fruits, and the hatched larvae feed on the fruit pulp, causing internal damage that leads to premature fruit drop and significant yield losses. The pest is highly mobile and can spread rapidly between orchards. Adult flies are attracted to ripening fruits and can detect them from considerable distances. Infested fruits often show no external signs until the damage is severe.',
    controlMethod: 'Cultural control: Harvest fruits early, remove fallen fruits, and maintain orchard sanitation. Physical control: Use fruit bagging to protect developing fruits, implement mass trapping with pheromone traps, and use sticky traps for monitoring. Chemical control: Apply spinosad or malathion-based baits, and use protein bait sprays. Biological control: Release parasitic wasps like Fopius arisanus. Integrated approach: Combine monitoring, trapping, and targeted spraying during peak activity periods.',
    placeholderImage: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&h=600&fit=crop'
  },
  {
    id: 'powdery-mildew-001',
    name: 'Powdery Mildew',
    type: 'DISEASE' as const,
    severity: 6,
    spreadability: 6,
    shortDescription: 'A fungal disease that covers leaves and flowers with white powdery growth, affecting fruit set.',
    longDescription: 'Powdery mildew, caused by Oidium mangiferae, is a common fungal disease that affects mango trees during the flowering and early fruit development stages. The disease appears as white to grayish powdery growth on leaves, flowers, and young fruits. It can significantly reduce fruit set and quality by affecting flower development and causing fruit drop. The fungus thrives in moderate temperatures and high humidity, particularly during the flowering season. Severe infections can lead to complete crop loss in susceptible varieties.',
    controlMethod: 'Cultural control: Plant resistant varieties, maintain proper tree spacing, and avoid excessive nitrogen fertilization. Chemical control: Apply sulfur-based fungicides, potassium bicarbonate, or neem oil during flowering. Biological control: Use beneficial microorganisms like Bacillus subtilis. Preventive measures: Monitor weather conditions and apply preventive fungicides before flowering begins. Regular monitoring and early intervention are crucial for effective control.',
    placeholderImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop'
  }
]

async function createDiseases(imageUrls: string[]) {
  const diseases = diseaseData.map((disease, index) => ({
    ...disease,
    imageLink: imageUrls[index] || disease.placeholderImage
  }))

  for (const disease of diseases) {
    await prisma.disease.upsert({
      where: { id: disease.id },
      update: disease,
      create: disease
    })
    console.log(`✅ Created/Updated disease: ${disease.name}`)
  }
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default admin user (only if Supabase is configured)
  if (supabase) {
    const adminEmail = 'admin@mangoorg.com'
    const adminPassword = 'admin123456' // Change this to a secure password
    
    console.log('👤 Creating default admin user...')
    
    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: 'Admin User'
        }
      })

      if (authError) {
        console.error('❌ Error creating admin user:', authError.message)
        // If user already exists, that's fine
        if (!authError.message.includes('already registered')) {
          throw authError
        }
      } else {
        console.log('✅ Admin user created successfully')
      }

      // Get the user ID (either newly created or existing)
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const adminUser = users.find((u: any) => u.email === adminEmail)
      
      if (!adminUser) {
        throw new Error('Admin user not found after creation')
      }

      // Create admin profile
      await prisma.profile.upsert({
        where: { userId: adminUser.id },
        update: { role: 'ADMIN' },
        create: {
          userId: adminUser.id,
          role: 'ADMIN'
        }
      })

      console.log('✅ Admin profile created successfully')
      console.log(`📧 Admin email: ${adminEmail}`)
      console.log(`🔑 Admin password: ${adminPassword}`)
      
    } catch (error) {
      console.error('❌ Error setting up admin user:', error)
      // Continue with disease seeding even if admin setup fails
    }
  } else {
    console.log('⚠️  Supabase not configured - skipping admin user creation')
    console.log('📝 To create admin user, ensure:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL is set in .env.local')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY is set in .env')
  }

  // Upload seed images and create diseases
  if (supabase) {
    console.log('📸 Uploading seed images...')
    
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`)
      }

      const diseaseImagesBucket = buckets.find((bucket: any) => bucket.name === 'disease-images')

      if (!diseaseImagesBucket) {
        console.log('⚠️  Bucket "disease-images" not found!')
        console.log('📝 Please create the bucket first:')
        console.log('   1. Go to Supabase Dashboard → Storage')
        console.log('   2. Create bucket: "disease-images"')
        console.log('   3. Set to public (for read access)')
        console.log('   4. Run this script again')
        console.log('')
        console.log('🔄 Continuing with placeholder images...')
        
        // Create diseases with placeholder images
        await createDiseases([])
        return
      }

      console.log('✅ Bucket "disease-images" found')

      // Upload seed images
      const seedImagesDir = path.join(__dirname, 'seed-images')
      
      if (!fs.existsSync(seedImagesDir)) {
        console.log('⚠️  seed-images directory not found!')
        console.log('📝 Please create the seed-images directory with your images')
        console.log('🔄 Continuing with placeholder images...')
        await createDiseases([])
        return
      }

      const imageFiles = [
        { name: 'anthracnose.jpg', path: path.join(seedImagesDir, 'anthracnose.jpg') },
        { name: 'mango-fruit-fly.jpg', path: path.join(seedImagesDir, 'mango-fruit-fly.jpg') },
        { name: 'powdery-mildew.webp', path: path.join(seedImagesDir, 'powdery-mildew.webp') }
      ]

      const uploadedUrls: string[] = []

      for (const imageFile of imageFiles) {
        if (fs.existsSync(imageFile.path)) {
          const url = await uploadSeedImage(imageFile.path, imageFile.name)
          uploadedUrls.push(url)
        } else {
          console.log(`⚠️  ${imageFile.name} not found, using placeholder`)
          uploadedUrls.push('') // Empty string will trigger placeholder fallback
        }
      }

      // Create diseases with uploaded images
      await createDiseases(uploadedUrls)

    } catch (error) {
      console.error('❌ Error uploading images:', error)
      console.log('🔄 Continuing with placeholder images...')
      await createDiseases([])
    }
  } else {
    console.log('⚠️  Supabase not configured - using placeholder images')
    await createDiseases([])
  }

  console.log('🎉 Database seeding completed!')
  
  if (supabase) {
    console.log('')
    console.log('📝 Login Credentials:')
    console.log('📧 Email: admin@mangoorg.com')
    console.log('🔑 Password: admin123456')
    console.log('')
    console.log('⚠️  Important: Change the admin password after first login!')
  } else {
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Set up Supabase environment variables')
    console.log('2. Run the seed script again to create admin user')
    console.log('3. Visit /diseases to see the seeded data')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
