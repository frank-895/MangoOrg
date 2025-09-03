import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('📝 Please ensure:')
  console.log('   - NEXT_PUBLIC_SUPABASE_URL is set in .env.local')
  console.log('   - SUPABASE_SERVICE_ROLE_KEY is set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const diseaseImagesBucket = buckets.find(bucket => bucket.name === 'disease-images')

    if (!diseaseImagesBucket) {
      console.log('⚠️  Bucket "disease-images" not found!')
      console.log('📝 Please create the bucket manually in Supabase Dashboard:')
      console.log('   1. Go to Storage section')
      console.log('   2. Create bucket: "disease-images"')
      console.log('   3. Set to public (for read access)')
      console.log('   4. Run this script again to set up policies')
      return
    }

    console.log('✅ Bucket "disease-images" found')

    // Set up RLS policies using the SQL editor approach
    console.log('🔧 Setting up storage policies...')
    
    // Note: These policies need to be created manually in the Supabase SQL Editor
    // because the JavaScript client doesn't have direct SQL execution capabilities
    console.log('')
    console.log('📝 Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('-- Public read access')
    console.log('CREATE POLICY IF NOT EXISTS "Public read access" ON storage.objects')
    console.log('FOR SELECT USING (bucket_id = \'disease-images\');')
    console.log('')
    console.log('-- Admin-only insert access')
    console.log('CREATE POLICY IF NOT EXISTS "Admin insert access" ON storage.objects')
    console.log('FOR INSERT WITH CHECK (')
    console.log('  bucket_id = \'disease-images\'')
    console.log('  AND auth.role() = \'authenticated\'')
    console.log('  AND EXISTS (')
    console.log('    SELECT 1 FROM profiles')
    console.log('    WHERE user_id = auth.uid() AND role = \'ADMIN\'')
    console.log('  )')
    console.log(');')
    console.log('')
    console.log('-- Admin-only update access')
    console.log('CREATE POLICY IF NOT EXISTS "Admin update access" ON storage.objects')
    console.log('FOR UPDATE USING (')
    console.log('  bucket_id = \'disease-images\'')
    console.log('  AND auth.role() = \'authenticated\'')
    console.log('  AND EXISTS (')
    console.log('    SELECT 1 FROM profiles')
    console.log('    WHERE user_id = auth.uid() AND role = \'ADMIN\'')
    console.log('  )')
    console.log(');')
    console.log('')
    console.log('-- Admin-only delete access')
    console.log('CREATE POLICY IF NOT EXISTS "Admin delete access" ON storage.objects')
    console.log('FOR DELETE USING (')
    console.log('  bucket_id = \'disease-images\'')
    console.log('  AND auth.role() = \'authenticated\'')
    console.log('  AND EXISTS (')
    console.log('    SELECT 1 FROM profiles')
    console.log('    WHERE user_id = auth.uid() AND role = \'ADMIN\'')
    console.log('  )')
    console.log(');')
    console.log('')
    console.log('📝 Steps to apply policies:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy and paste the SQL above')
    console.log('3. Click "Run" to execute')
    console.log('4. Verify policies are created in Storage → Policies')
    console.log('')
    console.log('✅ Storage setup instructions completed!')

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    process.exit(1)
  }
}

setupStorage()
