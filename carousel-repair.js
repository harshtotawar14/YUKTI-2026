(() => {
  'use strict';

  const slides=[
    {src:'/assets/hero-trusted-local.svg',label:'Trusted local services from verified cooperative workers'},
    {src:'/assets/hero-book-service.svg',label:'Book a service easily'},
    {src:'/assets/hero-verified-workers.svg',label:'Verified cooperative workers'},
    {src:'/assets/hero-cooperative-support.svg',label:'Local first with cooperative support'},
    {src:'/assets/hero-service-journey.svg',label:'Transparent service journey'}
  ];

  function apply(frame,index){
    const safe=((Number(index)||0)%slides.length+slides.length)%slides.length;
    const slide=slides[safe];
    frame.style.backgroundImage=`url("${slide.src}")`;
    frame.style.backgroundPosition='center center';
    frame.style.backgroundSize='cover';
    frame.style.backgroundRepeat='no-repeat';
    frame.style.backgroundColor='#f7fbff';
    frame.setAttribute('aria-label',slide.label);
  }

  function install(){
    const frame=document.querySelector('#landing.reference-home #home .sanpaid-hero-carousel-frame');
    if(!frame){setTimeout(install,60);return;}
    if(frame.dataset.renderRepair==='1')return;
    frame.dataset.renderRepair='1';

    slides.forEach(slide=>{const img=new Image();img.decoding='async';img.src=slide.src;});
    apply(frame,frame.dataset.slide||0);

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.attributeName==='data-slide'))apply(frame,frame.dataset.slide||0);
    });
    observer.observe(frame,{attributes:true,attributeFilter:['data-slide']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
