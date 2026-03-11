import axios from 'axios';

export const customerLoginOtp = async (req, res) => {
  const startTime = Date.now();
  const logData = {
    timestamp: new Date().toISOString(),
    phone: req.body.phone,
    templateName: 'customer_login_otp_1'
  };

  try {
    const { phone, otp } = req.body;

    console.log(`[WhatsApp] Starting customer OTP send:`, logData);

    if (!phone || !otp) {
      console.log(`[WhatsApp] ERROR - Missing required fields:`, { phone: !!phone, otp: !!otp });
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and OTP are required' 
      });
    }

    // WhatsApp Business API configuration
    const whatsappConfig = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      apiUrl: `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
    };

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }

    console.log(`[WhatsApp] Formatted phone: ${phone} -> ${formattedPhone}`);

    // Template message payload for customer OTP (authentication template with copy code)
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: 'customer_login_otp_1',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: otp }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: otp }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp] Sending customer OTP to Meta API:`, {
      url: whatsappConfig.apiUrl,
      to: formattedPhone,
      template: 'customer_login_otp_1',
      payload: JSON.stringify(messagePayload, null, 2)
    });

    // Send WhatsApp message
    const response = await axios.post(whatsappConfig.apiUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;
    const successLog = {
      ...logData,
      status: 'SUCCESS',
      messageId: response.data.messages?.[0]?.id,
      duration: `${duration}ms`,
      formattedPhone
    };

    console.log(`[WhatsApp] CUSTOMER OTP SUCCESS:`, successLog);

    res.json({ 
      success: true, 
      message: 'WhatsApp OTP sent successfully',
      messageId: response.data.messages?.[0]?.id 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorLog = {
      ...logData,
      status: 'ERROR',
      error: error.response?.data || error.message,
      duration: `${duration}ms`
    };

    console.error(`[WhatsApp] CUSTOMER OTP ERROR:`, errorLog);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send WhatsApp OTP',
      details: error.response?.data?.error?.message || error.message
    });
  }
};

export const customerDriverAssigned = async (req, res) => {
  const startTime = Date.now();
  const logData = {
    timestamp: new Date().toISOString(),
    phone: req.body.phone,
    templateName: req.body.templateName,
    bookingDetails: req.body.parameters
  };

  try {
    const { phone, templateName, parameters } = req.body;

    console.log(`[WhatsApp] Starting customer notification template send:`, logData);

    if (!phone || !templateName) {
      console.log(`[WhatsApp] ERROR - Missing required fields:`, { phone: !!phone, templateName: !!templateName });
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

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('91')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '91' + formattedPhone;
    }

    console.log(`[WhatsApp] Formatted phone: ${phone} -> ${formattedPhone}`);

    // Template message payload for customer notification (4 parameters)
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
              { type: 'text', text: parameters.customerName },
              { type: 'text', text: parameters.pickupTime },
              { type: 'text', text: parameters.driverName },
              { type: 'text', text: parameters.driverMobile },
              { type: 'text', text: parameters.bookingType }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp] Sending customer notification to Meta API:`, {
      url: whatsappConfig.apiUrl,
      to: formattedPhone,
      template: templateName
    });

    // Send WhatsApp message
    const response = await axios.post(whatsappConfig.apiUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;
    const successLog = {
      ...logData,
      status: 'SUCCESS',
      messageId: response.data.messages?.[0]?.id,
      duration: `${duration}ms`,
      formattedPhone
    };

    console.log(`[WhatsApp] CUSTOMER NOTIFICATION SUCCESS:`, successLog);

    res.json({ 
      success: true, 
      message: 'WhatsApp customer notification sent successfully',
      messageId: response.data.messages?.[0]?.id 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorLog = {
      ...logData,
      status: 'ERROR',
      error: error.response?.data || error.message,
      duration: `${duration}ms`
    };

    console.error(`[WhatsApp] CUSTOMER NOTIFICATION ERROR:`, errorLog);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send WhatsApp customer notification',
      details: error.response?.data?.error?.message || error.message
    });
  }
};

export const driverBookingConfirmation = async (req, res) => {
  const startTime = Date.now();
  const logData = {
    timestamp: new Date().toISOString(),
    phone: req.body.phone,
    templateName: req.body.templateName,
    bookingDetails: req.body.parameters
  };

  try {
    const { phone, templateName, parameters } = req.body;

    console.log(`[WhatsApp] Starting confirmation template send:`, logData);

    if (!phone || !templateName) {
      console.log(`[WhatsApp] ERROR - Missing required fields:`, { phone: !!phone, templateName: !!templateName });
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

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('91')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '91' + formattedPhone;
    }

    console.log(`[WhatsApp] Formatted phone: ${phone} -> ${formattedPhone}`);

    // Template message payload for confirmation (6 parameters)
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
              { type: 'text', text: parameters.pickupTime },
              { type: 'text', text: parameters.customerContact }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp] Sending confirmation to Meta API:`, {
      url: whatsappConfig.apiUrl,
      to: formattedPhone,
      template: templateName
    });

    // Send WhatsApp message
    const response = await axios.post(whatsappConfig.apiUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;
    const successLog = {
      ...logData,
      status: 'SUCCESS',
      messageId: response.data.messages?.[0]?.id,
      duration: `${duration}ms`,
      formattedPhone
    };

    console.log(`[WhatsApp] CONFIRMATION SUCCESS:`, successLog);

    res.json({ 
      success: true, 
      message: 'WhatsApp confirmation template sent successfully',
      messageId: response.data.messages?.[0]?.id 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorLog = {
      ...logData,
      status: 'ERROR',
      error: error.response?.data || error.message,
      duration: `${duration}ms`
    };

    console.error(`[WhatsApp] CONFIRMATION ERROR:`, errorLog);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send WhatsApp confirmation template',
      details: error.response?.data?.error?.message || error.message
    });
  }
};

export const driverBookingAssignment = async (req, res) => {
  const startTime = Date.now();
  const logData = {
    timestamp: new Date().toISOString(),
    phone: req.body.phone,
    templateName: req.body.templateName,
    bookingDetails: req.body.parameters
  };

  try {
    const { phone, templateName, parameters } = req.body;

    console.log(`[WhatsApp] Starting template send:`, logData);

    if (!phone || !templateName) {
      console.log(`[WhatsApp] ERROR - Missing required fields:`, { phone: !!phone, templateName: !!templateName });
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

    console.log(`[WhatsApp] Formatted phone: ${phone} -> ${formattedPhone}`);

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
          }
        ]
      }
    };

    console.log(`[WhatsApp] Sending to Meta API:`, {
      url: whatsappConfig.apiUrl,
      to: formattedPhone,
      template: templateName
    });

    // Send WhatsApp message
    const response = await axios.post(whatsappConfig.apiUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;
    const successLog = {
      ...logData,
      status: 'SUCCESS',
      messageId: response.data.messages?.[0]?.id,
      duration: `${duration}ms`,
      formattedPhone
    };

    console.log(`[WhatsApp] SUCCESS:`, successLog);

    res.json({ 
      success: true, 
      message: 'WhatsApp template sent successfully',
      messageId: response.data.messages?.[0]?.id 
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorLog = {
      ...logData,
      status: 'ERROR',
      error: error.response?.data || error.message,
      duration: `${duration}ms`
    };

    console.error(`[WhatsApp] ERROR:`, errorLog);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send WhatsApp template',
      details: error.response?.data?.error?.message || error.message
    });
  }
};