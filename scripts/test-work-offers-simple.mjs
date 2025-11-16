/**
 * Simplified Work Offer Test
 * Run with: API_KEY=your_key_here node scripts/test-work-offers-simple.mjs
 */

console.log('\n📝 Work Offer System Test - Environment Check');
console.log('='.repeat(60));

// Check if API key is available
const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
if (!apiKey) {
    console.log('\n❌ No API key found in environment');
    console.log('\nTo run this test, set your Google Gemini API key:');
    console.log('   export API_KEY=your_gemini_api_key_here');
    console.log('   node scripts/test-work-offers-simple.mjs');
    console.log('\nOr check your .env.local file and run:');
    console.log('   source .env.local');
    console.log('   node scripts/test-work-offers-simple.mjs');
    process.exit(1);
}

console.log('✅ API key found (length:', apiKey.length, ')');
console.log('   First 10 chars:', apiKey.substring(0, 10) + '...');

// Test import
try {
    const { GoogleGenAI } = await import("@google/genai");
    console.log('✅ GoogleGenAI package imported successfully');

    const ai = new GoogleGenAI({ apiKey });
    console.log('✅ GoogleGenAI client initialized');

    console.log('\n✨ Environment is configured correctly!');
    console.log('\nNow run the full test suite:');
    console.log('   node scripts/test-work-offers.mjs');

} catch (error) {
    console.log('\n❌ Error importing GoogleGenAI:', error.message);
}
