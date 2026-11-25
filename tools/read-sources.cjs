const fs = require('node:fs');
const {PDFParse} = require('pdf-parse');
const Zip = require('adm-zip');
(async()=>{
 const pdf = new PDFParse({data:fs.readFileSync('C:/Users/FWD8D/Downloads/Laboratorio_NodeJS_OWASP_Deploy (1).pdf')});
 console.log('LABORATORIO\n'+(await pdf.getText()).text); await pdf.destroy();
 const zip=new Zip('C:/Users/FWD8D/Downloads/Autenticación avanzada y seguridad web.pptx');
 for(const e of zip.getEntries().filter(e=>/^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(e.entryName))) console.log(e.entryName+'\n'+e.getData().toString().replace(/<a:t>/g,'\n').replace(/<[^>]+>/g,' '));
})();
