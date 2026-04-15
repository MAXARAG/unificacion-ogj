# Plan: Integración Mesa de Entradas con Sheet

**Sheet:** `1o0ihdTyFvqKp_TaVEtwedUScPOGZtZyJZPFoVUartA8`  
**Hoja:** `.ESCRITOS`

---

## 📊 Columnas del Sheet

| Col | Campo JS | Descripción |
|----|----------|-------------|
| A | usuario | Usuario que ingresa |
| B | id | ID único del escrito |
| C | fecha | Fecha ingreso |
| D | hora | Hora ingreso |
| E | origen | Origen/remitente |
| F | cuij | Nro expediente CUIJ |
| G | caratula | Carátula del expediente |
| H | tipoRemitente | Tipo (Abogado, Fiscal, etc.) |
| K | tipoObjeto | Tipo objeto (Penal, Civil, etc.) |
| L | usuarioTramite | Usuario que ejecuta el trámite |
| M | tramite | Tipo de trámite |
| N | destino | Sector destino (Agenda, Gestión Casos, etc.) |
| O | estado | Estado (Pendientes, Finalizada) |
| P | obs | Observaciones |
| Q | timestamps | Array JSON [{ev, f, h, u}, ...] |

---

## 🔄 Flujo de Datos

```
Sheet ".ESCRITOS"
      │
      ▼
┌─────────────────┐
│  Code.gs        │
│  getEscritos()  │  ◄── Lee toda la hoja
│  getEstados()   │  ◄── Extrae valores únicos de columna O
│  getDestinos()  │  ◄── Extrae valores únicos de columna N
└─────────────────┘
      │
      ▼ (JSON)
┌─────────────────┐
│  Sidebar.html   │
│  JS: initMe()   │  ◄── Llama google.script.run
│                 │    → getEscritos()
│                 │    → getEstados()
│                 │    → getDestinos()
└─────────────────┘
      │
      ▼ (render)
┌─────────────────┐
│  MesaEntradas   │
│  .me-tabla      │  ◄── HTML table vacío
│  .me-status-bar │  ◄── Generado dinámicamente
│  .me-filters    │  ◄── Destinos dinámicos
└─────────────────┘
```

---

## 🏗️ Cambios por Archivo

### 1. Code.gs (+50 líneas)

```javascript
// Config
var SPREADSHEET_ID = '1o0ihdTyFvqKp_TaVEtwedUScPOGZtZyJZPFoVUartA8';
var HOJA_ESCRITOS = '.ESCRITOS';

/**
 * Lee todos los escritos desde el Sheet
 * @return {Array} Array de objetos con todas las columnas
 */
function getEscritos() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(HOJA_ESCRITOS);
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return []; // Solo header o vacío
  
  var data = sheet.getRange(2, 1, lastRow - 1, 17).getDisplayValues(); // A:Q = 17 cols
  var headers = data[0]; // primera fila = headers (si aplica)
  
  return data.slice(1).map(function(row) {
    return {
      usuario:        row[0],  // A
      id:             row[1],  // B
      fecha:          row[2],  // C
      hora:           row[3],  // D
      origen:         row[4],  // E
      cuij:           row[5],  // F
      caratula:        row[6],  // G
      tipoRemitente:   row[7],  // H
      tipoObjeto:     row[10], // K
      usuarioTramite:row[11], // L
      tramite:        row[12], // M
      destino:       row[13], // N
      estado:        row[14], // O
      obs:            row[15], // P
      timestamps:     row[16]  // Q (JSON string)
    };
  });
}

/**
 * Obtiene estados únicos desde el Sheet
 * @return {Array} ['Pendientes', 'Finalizada']
 */
function getEstados() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(HOJA_ESCRITOS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ['Pendientes', 'Finalizada'];
  
  var estadoCol = sheet.getRange(2, 15, lastRow - 1, 1).getDisplayValues(); // O = col 15
  var estados = estadoCol.flat().filter(function(e) { return e && e.trim(); });
  
  // Unicos y preserve order
  var unique = [];
  estados.forEach(function(e) {
    if (unique.indexOf(e) === -1) unique.push(e);
  });
  
  return unique.length > 0 ? unique : ['Pendientes', 'Finalizada'];
}

/**
 * Obtiene destinos únicos (sectores) desde el Sheet
 * @return {Array} ['Agenda', 'Gestión de Casos', 'Gestor Jurídico', ...]
 */
function getDestinos() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(HOJA_ESCRITOS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  var destinoCol = sheet.getRange(2, 14, lastRow - 1, 1).getDisplayValues(); // N = col 14
  var destinos = destinoCol.flat().filter(function(d) { return d && d.trim(); });
  
  var unique = [];
  destinos.forEach(function(d) {
    if (unique.indexOf(d) === -1) unique.push(d);
  });
  
  return unique;
}
```

### 2. MesaEntradas.html
- **Cambio:** La tabla `<tbody>` queda vacía (`<tbody id="me-tbody"></tbody>`)
- **Status bar:** Pills hardcodeados por ahora: Todos, Pendientes, Finalizada
- **Filtro destino:** `<select>` se poblará dinámicamente o hardcoded

### 3. Sidebar.html (+60 líneas JS)

```javascript
// ── MESA DE ENTRADAS — INIT DINÁMICO ───────────────────
function initMesaEntradas() {
  // Primero: mostrar loader
  var tbody = document.getElementById('me-tbody');
  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">Cargando...</td></tr>';
  
  // Llamar al backend
  google.script.run
    .withSuccessHandler(function(data) {
      renderEscritos(data.escritos);
      renderFiltros(data.estados, data.destinos);
    })
    .withFailureHandler(function(err) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--red);">Error: ' + err.message + '</td></tr>';
    })
    .getEscritosData();
}

function renderEscritos(escritos) {
  var tbody = document.getElementById('me-tbody');
  tbody.innerHTML = '';
  
  escritos.forEach(function(e) {
    var badgeClass = e.estado === 'Finalizada' ? 'badge-resuelto' : 'badge-pendiente';
    var tiempo = calcularTiempo(e.fecha, e.hora);
    
    var tr = document.createElement('tr');
    tr.className = 'me-row';
    tr.setAttribute('data-id', e.id);
    tr.setAttribute('data-estado', e.estado);
    tr.setAttribute('data-fecha', e.fecha);
    tr.setAttribute('data-hora', e.hora);
    tr.setAttribute('data-origen', e.origen);
    tr.setAttribute('data-cuij', e.cuij);
    tr.setAttribute('data-caratula', e.caratula);
    tr.setAttribute('data-tipo-remitente', e.tipoRemitente);
    tr.setAttribute('data-tipo-objeto', e.tipoObjeto);
    tr.setAttribute('data-usuario-ingresa', e.usuario);
    tr.setAttribute('data-usuario-ejecuta', e.usuarioTramite || '');
    tr.setAttribute('data-tramite', e.tramite);
    tr.setAttribute('data-destino', e.destino);
    tr.setAttribute('data-obs', e.obs || '');
    tr.setAttribute('data-timestamps', e.timestamps || '[]');
    
    tr.innerHTML =
      '<td class="id-cell">' + e.id + '</td>' +
      '<td>' + e.fecha + '</td>' +
      '<td>' + e.hora + '</td>' +
      '<td>' + e.origen + '</td>' +
      '<td>' + e.tramite + '</td>' +
      '<td class="' + (e.usuarioTramite ? '' : 'text-muted-cell') + '">' + (e.usuarioTramite || '—') + '</td>' +
      '<td>' + e.destino + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + e.estado + '</span></td>' +
      '<td class="me-time-cell' + (e.estado === 'Pendientes' && tiempo.urgente ? ' me-time-urgent' : '') + '">' + tiempo.label + '</td>' +
      '<td><button class="btn-icon me-open-btn">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</button></td>';
    
    tr.querySelector('.me-open-btn').onclick = function(ev) {
      ev.stopPropagation();
      openMeDrawer(tr);
    };
    
    tr.onclick = function() { openMeDrawer(tr); };
    
    tbody.appendChild(tr);
  });
}

function renderFiltros(estados, destinos) {
  // Status pills (Todos + los del sheet)
  var statusBar = document.querySelector('.me-status-bar');
  var html = '<button class="me-status-btn active" data-filter-status="todos">Todos <span class="me-count">' + '</span></button>';
  
  estados.forEach(function(est) {
    html += '<button class="me-status-btn" data-filter-status="' + est + '">' + est + '</button>';
  });
  
  statusBar.innerHTML = html;
  
  // Destinos en el select
  var destSelect = document.getElementById('me-filter-destino');
  if (destSelect) {
    destSelect.innerHTML = '<option value="">Todos los sectores</option>';
    destinos.forEach(function(d) {
      destSelect.innerHTML += '<option value="' + d + '">' + d + '</option>';
    });
  }
}

function calcularTiempo(fecha, hora) {
  // Parsear fecha/hora y calcular tiempo transcurrido
  // Return: { label: "2h 30m", urgente: true/false }
  // Placeholder por ahora
  return { label: '—', urgente: false };
}
```

---

## 🧪 Testing

1. **Deploy:** `clasp push --force`
2. **Nueva implementación Web App**
3. **Verificar:**
   - [ ] Tabla carga datos del Sheet
   - [ ] Estados únicos aparecen en pills
   - [ ] Destinos únicos aparecen en select
   - [ ] Click en fila abre drawer con datos
   - [ ] Filtros funcionan

---

## 📦 Entregable al Aprobar

- [ ] `Code.gs` con 3 funciones nuevas
- [ ] `MesaEntradas.html` con tbody vacío
- [ ] `Sidebar.html` con JS dinámico
- [ ] `clasp push` + deploy
- [ ] Testing en producción

---

**Aprobado por usuario:** ⏳  
**Fecha estimado de testing:** Una vez aprobado el plan