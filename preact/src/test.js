function steps(min,max,num) {

  let e=0;
  let s=(max-min)/num
  while (Math.round(s*Math.pow(10,e))) {
    e--;
  }
  while (Math.round(s*Math.pow(10,e))<1) {
    e++;
  }
  let m = Math.round(s*Math.pow(10,e));
  if (m>10 ||m<1) {
    throw Error("invalid m")
  }
  if (m>2 && m<5) {
    m=5;
  }
  if (m>5) {
    m=10;
  }
  let step = m/Math.pow(10,e);
  let res = [];
  for (i=Math.floor(min/step);i*step<max;++i) {
    console.log("i,i*step,i*step*Math.pow(10,e)",i,i*step,i*step*Math.pow(10,e));
    res.push(Math.round(i*step*Math.pow(10,e))/Math.pow(10,e));
  }
  console.log(min,max,JSON.stringify(res));
  return res;
}


steps(0.2100,0.2300,10);
