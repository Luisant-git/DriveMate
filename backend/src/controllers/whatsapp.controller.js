import axios from 'axios';

export const sendTemplate = async (req, res) => {
  try {
    const { phone, templateName, parameters } = req.body;

    if (!phone || !templateName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and template name are required' 
      });
    }

    // WhatsApp Business API configuration
    const whatsappConfig = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      apiUrl: `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
    };

    // Format phone number (remove +91 if present, ensure it starts with 91)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('91')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '91' + formattedPhone;
    }

    // Template message payload
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: parameters.bookingType },
              { type: 'text', text: parameters.fareAmount },
              { type: 'text', text: parameters.pickup },
              { type: 'text', text: parameters.destination },
              { type: 'text', text: parameters.tripTime }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 1,
            parameters: [
              { type: 'text', text: '' }
            ]
          }
        ]
      }
    };

    // Send WhatsApp message
    const response = await axios.post(whatsappConfig.apiUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ 
      success: true, 
      message: 'WhatsApp template sent successfully',
      messageId: response.data.messages?.[0]?.id 
    });

  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send WhatsApp template',
      details: error.response?.data?.error?.message || error.message
    });
  }
};