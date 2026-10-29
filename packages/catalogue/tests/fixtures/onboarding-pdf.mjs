// Minimal authored PDF bytes for parser regressions, never a real identity source.
export function authoredPdf(text,{pages=1}={}){
 const escape=s=>s.replace(/[\\()]/g,'\\$&'),lines=[];
 for(const raw of text.split('\n')){let line='';for(const word of raw.split(' ')){if(line&&line.length+word.length+1>75){lines.push(line);line='';}line+=(line?' ':'')+word;}lines.push(line);}
 const stream=`BT /F1 11 Tf 30 760 Td ${lines.map((s,i)=>`${i?'0 -16 Td ':''}(${escape(s)}) Tj`).join('\n')} ET`,
 objects=['<< /Type /Catalog /Pages 2 0 R >>',`<< /Type /Pages /Count ${pages} /Kids [${Array.from({length:pages},(_,i)=>`${5+i} 0 R`).join(' ')}] >>`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ...Array.from({length:pages},()=>`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>`)];
 let result='%PDF-1.7\n',offsets=[0];for(const [i,o]of objects.entries()){offsets.push(Buffer.byteLength(result));result+=`${i+1} 0 obj\n${o}\nendobj\n`;}
 const xref=Buffer.byteLength(result);result+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return Buffer.from(result);
}
