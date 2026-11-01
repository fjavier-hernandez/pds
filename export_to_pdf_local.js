// Script para generar PDF desde HTML local generado por mkdocs build
// Requiere: npm i --save puppeteer

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

var args = process.argv.slice(2);
var htmlPath = args[0] || 'site/print_page.html';
var pdfPath = args[1] || 'Propuesta_Didáctica_ASO_2025-2026.pdf';
var title = args[2] || 'Propuesta Didáctica ASO';

// Convertir a ruta absoluta
const htmlAbsolutePath = path.resolve(htmlPath);
const pdfAbsolutePath = path.resolve(pdfPath);

console.log('📄 Generando PDF desde HTML local...');
console.log(`   HTML: ${htmlAbsolutePath}`);
console.log(`   PDF: ${pdfAbsolutePath}`);

// Verificar que el HTML existe
if (!fs.existsSync(htmlAbsolutePath)) {
    console.error(`❌ Error: No se encuentra el archivo ${htmlAbsolutePath}`);
    console.error('   Ejecuta primero: mkdocs build');
    process.exit(1);
}

(async() => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROME_BIN || null,
        args: [
            '--no-sandbox',
            '--headless',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-file-access-from-files'
        ]
    });

    const page = await browser.newPage();
    
    // Establecer el tamaño de vista
    await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
    });

    // Cargar el HTML desde archivo local usando file://
    const fileUrl = `file://${htmlAbsolutePath}`;
    console.log(`🌐 Cargando: ${fileUrl}`);
    
    await page.goto(fileUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // Esperar a que el CSS se cargue completamente
    await page.evaluateHandle(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que el contenido se cargó
    const contentLength = await page.evaluate(() => document.body.innerText.length);
    console.log(`✅ Contenido cargado: ${contentLength} caracteres`);

    // Generar PDF
    console.log('📑 Generando PDF...');
    await page.pdf({
        path: pdfAbsolutePath,
        format: 'A4',
        displayHeaderFooter: false,
        printBackground: true,
        landscape: false,
        scale: 1,
        preferCSSPageSize: true,
        margin: {
            top: '10mm',
            bottom: '10mm',
            left: '10mm',
            right: '10mm'
        }
    });

    await browser.close();

    // Verificar que se generó el PDF
    if (fs.existsSync(pdfAbsolutePath)) {
        const stats = fs.statSync(pdfAbsolutePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`✅ PDF generado exitosamente!`);
        console.log(`   📊 Tamaño: ${sizeKB} KB`);
        console.log(`   📍 Ubicación: ${pdfAbsolutePath}`);
    } else {
        console.error('❌ Error: No se pudo generar el PDF');
        process.exit(1);
    }
})();

