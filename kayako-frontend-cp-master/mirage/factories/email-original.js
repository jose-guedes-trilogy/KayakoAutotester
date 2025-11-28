import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  subject: 'Re: Please help me',
  from: 'jamie@jgwhite.co.uk',
  to: 'madebystrange@gmail.com',
  received_at: '15 May 2017 - 10:43:18',
  html_content: '<html><body><img src="https://i.pinimg.com/736x/e4/56/7b/e4567be54db192be0f7b236799bbe751--how-i-met-your-mother-poster-how-i-met-your-mother-barney.jpg"><div dir="ltr"><span style="color:rgb(0,0,0);font-family:raleway;font-size:17.25px">The beauty of me is that I’m very rich</span><br></div><div class="gmail_extra"><br><div class="gmail_quote">On 15 May 2017 at 11:33, Strange Studios <span dir="ltr">&lt;<a href="mailto:madebystrange@gmail.com" target="_blank">madebystrange@gmail.com</a>&gt;</span> wrote:<br><blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex"><div dir="ltr">I can&#39;t get out</div> </blockquote></div><br><br clear="all"><div><br></div>-- <br><div class="gmail_signature" data-smartmail="gmail_signature">+44 7899 872 935<br><a href="http://jgwhite.co.uk" target="_blank">http://jgwhite.co.uk</a><br></div><h1 onclick="javascript:console.log(\'CHEESE\', window.parent.document.cookie);">CHEESE</h1><script>alert("CHEESE");</script></body></html>',
  source_content: `Received: by mx0027p1las1.sendgrid.net with SMTP id k1jxha1Ape Mon, 15 May 2017 10:43:17 +0000 (UTC)<br />
  Received: from mail-qk0-f176.google.com (mail-qk0-f176.google.com [209.85.220.176]) by mx0027p1las1.sendgrid.net (Postfix) with ESMTPS id 28C6E64068E for &lt;support@aaron.kayako.com&gt;; Mon, 15 May 2017 10:43:16 +0000 (UTC)<br />
  Received: by mail-qk0-f176.google.com with SMTP id u75so89959733qka.3 for &lt;support@aaron.kayako.com&gt;; Mon, 15 May 2017 03:43:16 -0700 (PDT)<br />
  DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=jgwhite-co-uk.20150623.gappssmtp.com; s=20150623; h=mime-version:in-reply-to:references:from:date:message-id:subject:to :cc; bh=UdY1gnCqJnVQPgf9+WlfeKb9B1CEH4ME/VtsiZMHuug=; b=FmIgvNFDd+XGMdvNqAvHady6QVK4dKf8WB5j1VsaPUwAR/IREWcnoJg3/glxhUh+LB 5mkST3PmW1R9suxlcYNDt253vxL9+QwIPkzkxYgwlZwmSHTsAXd0wtEPkP/8RZUepKPl Yd0JqrGO5v00TvUrxfnX3keB4pSg3/YOYZIoHpEcAYwbnY9WVVSi0GX6TGj9fGkcQXRl v5CuybDH8LljE8OCxQuV+9JjvCK7as0LUM5mCyBUAzDeQdeLuHwT+FoFsI5n42+BmSxx nofh2Ed8KYJT2vhx2s9qWbRnb2C/EfIqzK7DGwFyA+0z/jwv9HucASnHeNaCTrDXjbCw auaQ==<br />
  X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20161025; h=x-gm-message-state:mime-version:in-reply-to:references:from:date :message-id:subject:to:cc; bh=UdY1gnCqJnVQPgf9+WlfeKb9B1CEH4ME/VtsiZMHuug=; b=F7g1fyfkP2sN2yrv8ljeDN0w13yMnwlhY7KWukzTL5h73H+IDRan6onOPRVbser787 9GL0X+dT/Y23eZNLyzgUqSfEs9VZcDFZQlcfKO8pVIp4G6OLYHXq7+0g8Oax5wcO/EDW TzK9/gWe6lW4f3bA78C8ayNR8mBf10ZJZXAIlI0ctPrhecnHLXjSc7H6AwLgx99LBq5o q/H5iN4NyTrgBfYwLGoRrBq6Z1R8hevOM/g1m2/jXbsGYgPuVov5neFTu79IV8HJS0En lBCqVOBQk5hDyzgD2IQPNloaB6YE6V23rkpnt0t10E441p01iH3Pv2ThbbF3MzlW6903 nC3g==<br />
  X-Gm-Message-State: AODbwcAQnR9CmjW0kn5fJqXW34N/XHFrpcy5F+4yKWsHPDlnfi6UxHBd +iC0lJxutt4JMbce0iWHEfaxWSKnNg==<br />
  X-Received: by 10.80.145.80 with SMTP id f16mr4323073eda.170.1494844995870; Mon, 15 May 2017 03:43:15 -0700 (PDT)<br />
  MIME-Version: 1.0<br />
  Received: by 10.80.179.39 with HTTP; Mon, 15 May 2017 03:43:15 -0700 (PDT)<br />
  X-Originating-IP: [109.159.159.194]<br />
  In-Reply-To: &lt;CACbPbPAu5EaLBr6umGE9LE3meWckGi7AAkP+0dUKyLiC2vUNrA@mail.gmail.com&gt;<br />
  References: &lt;CACbPbPAu5EaLBr6umGE9LE3meWckGi7AAkP+0dUKyLiC2vUNrA@mail.gmail.com&gt;<br />
  From: Jamie White &lt;jamie@jgwhite.co.uk&gt;<br />
  Date: Mon, 15 May 2017 11:43:15 +0100<br />
  Message-ID: &lt;CAP-gEAk6Mj=Zmx7Ds+d-Fpt_E75gC1Hu34eFp3X_Kaiec7Az4w@mail.gmail.com&gt;<br />
  Subject: Re: Please help me<br />
  To: Strange Studios &lt;madebystrange@gmail.com&gt;<br />
  Cc: support@aaron.kayako.com<br />
  Content-Type: multipart/alternative; boundary=&quot;f403045c07b8f9358c054f8db806&quot;<br />`,
  resource_type: 'email_original'
});
