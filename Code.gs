/**
 * Portal de registro · Pláticas de Negocios · Pirata y Ron 2026
 * Backend en Google Apps Script (los datos se guardan en esta hoja de cálculo).
 */

// ===================== CONFIGURACIÓN =====================
const CUPO = 30;          // lugares por plática
const MAX_POR_DIA = 3;    // pláticas máximas por alumno por día

const PLATICAS = [
  { id: 'V1', dia: 'viernes', hora: '13:00–13:30', titulo: 'El negocio detrás de la botella' },
  { id: 'V2', dia: 'viernes', hora: '13:40–14:10', titulo: '¿Qué hace que una marca sea comprable?' },
  { id: 'V3', dia: 'viernes', hora: '14:20–14:50', titulo: 'De producto a marca: cómo construir valor premium' },
  { id: 'V4', dia: 'viernes', hora: '15:00–15:30', titulo: 'Lo que un comprador necesita ver antes de decir sí' },
  { id: 'V5', dia: 'viernes', hora: '15:40–16:10', titulo: 'Ron, storytelling y percepción de valor' },
  { id: 'V6', dia: 'viernes', hora: '16:20–16:50', titulo: 'Consumo responsable y trago estándar' },
  { id: 'S1', dia: 'sabado',  hora: '13:20–13:50', titulo: '¿Qué está comprando México y por qué?' },
  { id: 'S2', dia: 'sabado',  hora: '14:00–14:30', titulo: '¿Qué está buscando el nuevo consumidor?' },
  { id: 'S3', dia: 'sabado',  hora: '14:40–15:10', titulo: 'Cómo entrar a hoteles y restaurantes' },
  { id: 'S4', dia: 'sabado',  hora: '15:20–15:50', titulo: 'Exportar sin improvisar: lo que debe estar listo antes de salir' },
  { id: 'S5', dia: 'sabado',  hora: '16:00–16:30', titulo: 'Ron + gastronomía + turismo: diseñar una experiencia que venda' },
];

const ENC_REG = ['Fecha', 'Folio', 'Nombre', 'Género', 'Matrícula', 'Correo', 'Carrera', 'Semestre', 'Teléfono', 'Pláticas viernes', 'Pláticas sábado'];
const ENC_INS = ['Fecha', 'ID plática', 'Día', 'Horario', 'Plática', 'Folio', 'Matrícula', 'Nombre', 'Correo', 'Teléfono'];
// =========================================================

/**
 * GET  ?accion=estado  -> JSON con cupos (lo usa la página en GitHub Pages)
 * GET  sin parámetros  -> la página servida por Google (respaldo)
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.accion === 'estado') return json_(getEstado());
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pláticas de Negocios · Pirata y Ron 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** POST {accion:'registrar', datos:{...}} -> JSON con el resultado del registro. */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Solicitud no válida.' });
  }
  if (body.accion === 'registrar') return json_(registrar(body.datos));
  if (body.accion === 'estado') return json_(getEstado());
  return json_({ ok: false, error: 'Acción no válida.' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Menú dentro de la hoja de cálculo. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏴‍☠️ Pirata y Ron')
    .addItem('Preparar hojas', 'prepararHojas')
    .addToUi();
}

/** Ejecútala una vez: crea las hojas Registros, Inscripciones y Cupos. */
function prepararHojas() {
  hoja_('Registros', ENC_REG);
  hoja_('Inscripciones', ENC_INS);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cupos = ss.getSheetByName('Cupos');
  if (!cupos) cupos = ss.insertSheet('Cupos');
  cupos.clear();
  const filas = [['ID', 'Día', 'Horario', 'Plática', 'Inscritos', 'Disponibles']];
  PLATICAS.forEach(function (p, i) {
    const r = i + 2;
    filas.push([p.id, p.dia === 'viernes' ? 'Viernes 20' : 'Sábado 21', p.hora, p.titulo,
      '=COUNTIF(Inscripciones!B:B,A' + r + ')', '=' + CUPO + '-E' + r]);
  });
  cupos.getRange(1, 1, filas.length, 6).setValues(filas);
  estilarEncabezado_(cupos, 6);
  cupos.autoResizeColumns(1, 6);
}

// ---------- API que llama la página ----------

function getEstado() {
  const c = conteos_();
  return {
    cupo: CUPO,
    maxPorDia: MAX_POR_DIA,
    platicas: PLATICAS.map(function (p) {
      return { id: p.id, dia: p.dia, hora: p.hora, titulo: p.titulo, inscritos: c[p.id] };
    })
  };
}

function registrar(datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (e) {
    return { ok: false, error: 'Hay muchas personas registrándose. Intenta de nuevo en unos segundos.' };
  }

  try {
    datos = datos || {};
    const t = function (v) { return String(v == null ? '' : v).trim(); };
    const d = {
      nombre: t(datos.nombre).replace(/\s+/g, ' '),
      genero: t(datos.genero),
      matricula: t(datos.matricula).toUpperCase(),
      correo: t(datos.correo).toLowerCase(),
      carrera: t(datos.carrera),
      semestre: t(datos.semestre),
      telefono: t(datos.telefono).replace(/\D/g, '')
    };

    // Validaciones
    for (const k in d) if (!d[k]) return { ok: false, error: 'Completa todos tus datos.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) return { ok: false, error: 'El correo no es válido.' };
    if (d.telefono.length !== 10) return { ok: false, error: 'El teléfono debe tener 10 dígitos.' };

    const ids = Array.isArray(datos.platicas) ? datos.platicas.map(String).filter(function (v, i, a) { return a.indexOf(v) === i; }) : [];
    if (!ids.length) return { ok: false, error: 'Elige al menos una plática.' };
    const sel = ids.map(function (id) { return PLATICAS.filter(function (p) { return p.id === id; })[0]; });
    if (sel.some(function (p) { return !p; })) return { ok: false, error: 'Selección no válida.' };
    const porDia = { viernes: 0, sabado: 0 };
    sel.forEach(function (p) { porDia[p.dia]++; });
    if (porDia.viernes > MAX_POR_DIA || porDia.sabado > MAX_POR_DIA)
      return { ok: false, error: 'Solo puedes elegir ' + MAX_POR_DIA + ' pláticas por día.' };

    // Duplicados
    const reg = hoja_('Registros', ENC_REG);
    const n = reg.getLastRow();
    if (n > 1) {
      const vals = reg.getRange(2, 5, n - 1, 2).getValues(); // Matrícula, Correo
      for (let i = 0; i < vals.length; i++) {
        if (String(vals[i][0]).trim().toUpperCase() === d.matricula)
          return { ok: false, error: 'Esta matrícula ya está registrada.' };
        if (String(vals[i][1]).trim().toLowerCase() === d.correo)
          return { ok: false, error: 'Este correo ya está registrado.' };
      }
    }

    // Cupo (verificado dentro del candado)
    const c = conteos_();
    const llenas = sel.filter(function (p) { return c[p.id] >= CUPO; });
    if (llenas.length) {
      return {
        ok: false,
        error: 'Se llenó el cupo de: ' + llenas.map(function (p) { return '“' + p.titulo + '”'; }).join(', ') + '. Elige otra(s).',
        llenas: llenas.map(function (p) { return p.id; }),
        estado: getEstado()
      };
    }

    // Guardar
    const ahora = new Date();
    const folio = 'PYR-' + ('000' + n).slice(-4);
    const lista = function (dia) {
      return sel.filter(function (p) { return p.dia === dia; })
        .map(function (p) { return p.hora + ' ' + p.titulo; }).join('\n');
    };
    reg.appendRow([ahora, folio, d.nombre, d.genero, "'" + d.matricula, d.correo, d.carrera, d.semestre,
      "'" + d.telefono, lista('viernes'), lista('sabado')]);

    const ins = hoja_('Inscripciones', ENC_INS);
    const filas = sel.map(function (p) {
      return [ahora, p.id, p.dia === 'viernes' ? 'Viernes 20' : 'Sábado 21', p.hora, p.titulo,
        folio, "'" + d.matricula, d.nombre, d.correo, "'" + d.telefono];
    });
    ins.getRange(ins.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    SpreadsheetApp.flush();

    return { ok: true, folio: folio, nombre: d.nombre, matricula: d.matricula, platicas: sel };
  } catch (err) {
    return { ok: false, error: 'Ocurrió un error al guardar. Intenta de nuevo.' };
  } finally {
    lock.releaseLock();
  }
}

// ---------- utilidades ----------

function conteos_() {
  const h = hoja_('Inscripciones', ENC_INS);
  const c = {};
  PLATICAS.forEach(function (p) { c[p.id] = 0; });
  const n = h.getLastRow();
  if (n > 1) {
    h.getRange(2, 2, n - 1, 1).getValues().forEach(function (r) {
      if (c[r[0]] !== undefined) c[r[0]]++;
    });
  }
  return c;
}

function hoja_(nombre, encabezados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    estilarEncabezado_(h, encabezados.length);
  }
  return h;
}

function estilarEncabezado_(h, cols) {
  h.setFrozenRows(1);
  h.getRange(1, 1, 1, cols).setFontWeight('bold').setBackground('#331a0d').setFontColor('#ffffff');
}
