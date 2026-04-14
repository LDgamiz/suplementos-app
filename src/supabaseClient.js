import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmtkmpongubjwrysofcq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdGttcG9uZ3ViandyeXNvZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzE2MTEsImV4cCI6MjA5MTc0NzYxMX0.6vsx9l35G9TDfFOiVDCcDtINpoWElt0BYvz9BfPbWJE'

export const supabase = createClient(supabaseUrl, supabaseKey)