// Test script to verify admin support message sending
// Run this in the browser console while on /admin/support

async function testSupportMessageSending() {
  console.log('🧪 Testing Admin Support Message Sending...\n');

  try {
    // Check if we're on the admin support page
    if (!window.location.pathname.includes('/admin/support')) {
      console.log('❌ Please navigate to /admin/support first');
      return;
    }

    // Check if there are any tickets
    const ticketElements = document.querySelectorAll('[data-testid="ticket-row"]');
    if (ticketElements.length === 0) {
      console.log('⚠️ No tickets found. Create a test ticket first.');
      return;
    }

    // Check if a ticket is selected
    const selectedTicket = document.querySelector('.bg-orange-50');
    if (!selectedTicket) {
      console.log('⚠️ Please select a ticket first by clicking on it.');
      return;
    }

    // Check if message input exists
    const messageInput = document.querySelector('textarea[placeholder*="message"]');
    if (!messageInput) {
      console.log('❌ Message input not found');
      return;
    }

    // Check if send button exists
    const sendButton = document.querySelector('button[type="button"]');
    if (!sendButton) {
      console.log('❌ Send button not found');
      return;
    }

    console.log('✅ All UI elements found');
    console.log('✅ Ready to test message sending');
    console.log('\n📝 To test:');
    console.log('   1. Type a test message in the textarea');
    console.log('   2. Click the "Send Message" button');
    console.log('   3. Check the browser console for any errors');
    console.log('   4. Check if the message appears in the conversation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSupportMessageSending();
