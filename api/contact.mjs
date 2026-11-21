const allowedServices = new Set(['Website Design','Landing Pages','Booking Forms','Conversion Optimization','Google Ads','Meta Ads','Lead Generation','Campaign Optimization','Social Media Management','AI Automations','AI Chatbots','AI Voice Assistants','Workflow Automation','Email & SMS Follow ups','A little of everything']);
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'});}
  const fail=(code,error)=>res.status(code).json({error});
  if(!String(req.headers['content-type']||'').startsWith('application/json')) return fail(415,'Please submit the enquiry form.');
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(origin){try{if(new URL(origin).host !== host)return fail(403,'Please submit from this website.');}catch{return fail(403,'Invalid origin.');}}
  let body=req.body;
  try {if(typeof body==='string')body=JSON.parse(body);}catch{return fail(400,'Invalid enquiry.');}
  if(!body||typeof body!=='object'||Array.isArray(body))return fail(400,'Invalid enquiry.');
  if(JSON.stringify(body).length>15000)return fail(413,'Your enquiry is too long.');
  if(body.companyfax)return fail(400,'Unable to submit this enquiry.');
  const field=(k,max)=>typeof body[k]==='string'?body[k].trim().slice(0,max+1):'';
  const name=field('name',100),email=field('email',254),business=field('business',200),service=field('service',100),message=field('message',5000),requestId=field('requestId',100);
  if(!name||name.length>100||/[\r\n]/.test(name)||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email)||business.length>200||!allowedServices.has(service)||message.length<10||message.length>5000||body.consent!=='on'||!/^[0-9a-f-]{36}$/i.test(requestId))return fail(400,'Please check the required fields and try again.');
  const {RESEND_API_KEY,CONTACT_TO,CONTACT_FROM}=process.env;
  if(!RESEND_API_KEY||!CONTACT_TO||!CONTACT_FROM)return fail(503,'The enquiry form is currently unavailable. Please email hello@wealsosocial.com.');
  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'alsosocial-enquiry/'+requestId},body:JSON.stringify({from:CONTACT_FROM,to:[CONTACT_TO],reply_to:email,subject:'AlsoSocial enquiry — '+service,text:`Name: ${name}\nEmail: ${email}\nBusiness: ${business||'Not supplied'}\nService: ${service}\n\n${message}\n\nConsent: permission to respond to this enquiry.`}),signal:AbortSignal.timeout(12000)});
    if(!response.ok)return fail(response.status===429?429:502,'Your enquiry could not be sent. Please try again shortly or email hello@wealsosocial.com.');
    const data=await response.json();if(!data.id)return fail(502,'Delivery could not be confirmed. Please try again.');
    // Optional Google Sheets sync. A Sheets outage must not discard a successfully emailed lead.
    const sheetsUrl=process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const sheetsSecret=process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
    if(sheetsUrl&&sheetsSecret){
      try{
        const target=new URL(sheetsUrl);
        if(target.protocol!=='https:'||target.hostname!=='script.google.com')throw new Error('Invalid Sheets webhook destination');
        const sheetsResponse=await fetch(target.toString(),{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({secret:sheetsSecret,requestId,name,email,business,service,message}),
          signal:AbortSignal.timeout(10000)
        });
        if(!sheetsResponse.ok)throw new Error('Sheets webhook HTTP error');
        const result=await sheetsResponse.json();
        if(result.ok!==true)throw new Error('Sheets webhook rejected submission');
      }catch(error){
        // Never log private form values or the webhook secret.
        console.error('Google Sheets sync failed:',error.message);
      }
    }
    return res.status(200).json({success:true});
  }catch{return fail(502,'Delivery could not be confirmed. Please try again or email hello@wealsosocial.com.');}
}
