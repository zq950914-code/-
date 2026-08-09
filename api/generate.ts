export const config = {
  runtime: 'edge'
}

export default async function handler(req: Request) {
  if(req.method!=='POST'){
    return Response.json({error:'Method not allowed'},{status:405})
  }

  const API_KEY = process.env.API_KEY || ''
  const API_BASE = process.env.API_BASE || 'https://your-proxy-api.com/v1'

  try {
    const body = await req.json()
    const { prompt, model, image } = body

    let payload:any
    if(model.startsWith('gpt')){
      payload = {
        model,
        messages:[
          {role:'user', content:image ? [
            {type:'text', text:prompt},
            {type:'image_url', image_url:{url:image}}
          ] : prompt}
        ]
      }
    }else{
      payload = {
        model,
        prompt,
        size:'1024x1024',
        n:1
      }
      if(image) payload.image = image
    }

    const resp = await fetch(
      model.startsWith('gpt') ? `${API_BASE}/chat/completions` : `${API_BASE}/images/generations`,
      {
        method:'POST',
        headers:{
          'Authorization':`Bearer ${API_KEY}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify(payload)
      }
    )

    const raw = await resp.json()
    if(!resp.ok){
      return Response.json({error:raw.error?.message||'上游API错误'},{status:400})
    }

    if(model.startsWith('gpt')){
      return Response.json({ text: raw.choices?.[0]?.message?.content || '' })
    }else{
      const images = raw.data?.map((item:any)=>item.url)||[]
      return Response.json({ images })
    }

  }catch(e:any){
    return Response.json({error:e.message||'服务异常'},{status:500})
  }
}
