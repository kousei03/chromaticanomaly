// FUCK YOU JAVASCRIPT!!!!!!
(function () {
  var draggedSrc = null;
  var draggedCategory = null;
  var draggedPlacedItem = null;
  var draggedPlacedCategory = null;
  var touchGhost = null;
  var lastTouchX = 0;
  var lastTouchY = 0;

  function init() {
    var items = document.querySelectorAll('.clothing-item[draggable="true"]');
    var zones = document.querySelectorAll('.drop-zone');

    items.forEach(function (el) {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
      el.addEventListener('touchstart', onTouchStart, { passive: false });
    });

    zones.forEach(function (zone) {
      zone.addEventListener('dragover', onDragOver);
      zone.addEventListener('dragleave', onDragLeave);
      zone.addEventListener('drop', onDrop);
    });

    document.addEventListener('drop', onDocumentDrop);
    document.addEventListener('dragover', onDocumentDragOver);

    var downloadBtn = document.getElementById('download-outfit-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', onDownloadOutfit);

    var clearBtn = document.getElementById('clear-outfit-btn');
    if (clearBtn) clearBtn.addEventListener('click', function () { location.reload(); });
  }

  function updateDressZoneTop() {
    var zoneDress = document.getElementById('zone-dress');
    if (!zoneDress) return;
    if (zoneDress.querySelector('.placed-item')) {
      zoneDress.classList.add('zone-drag-top');
    } else {
      zoneDress.classList.remove('zone-drag-top');
    }
  }

  function parsePercent(value) {
    if (typeof value !== 'string') return 0;
    var match = value.match(/^([\d.]+)%$/);
    return match ? parseFloat(match[1]) / 100 : 0;
  }

  function onDownloadOutfit() {
    var baseEl = document.getElementById('base-character');
    var dropZones = document.querySelectorAll('#drop-zones .drop-zone');
    if (!baseEl || !baseEl.complete) {
      alert('Please wait, system processing');
      return;
    }

    var w = baseEl.naturalWidth;
    var h = baseEl.naturalHeight;
    if (!w || !h) {
      alert('error');
      return;
    }

    var titleHeight = 120;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = titleHeight + h;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffb6c1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var leftPad = 24;
    ctx.fillStyle = '#753A85';
    ctx.textAlign = 'left';
    ctx.font = 'bold 150px Orbitron, sans-serif';
    ctx.fillText('Chromatic', leftPad, 140);
    ctx.fillText('Anomaly', leftPad, 260);
    ctx.font = '80px Orbitron, sans-serif';
    ctx.fillText('by Patty DeFelice', 28, 350);

    ctx.drawImage(baseEl, 0, titleHeight, w, h);

    [].forEach.call(dropZones, function (zone) {
      var placed = zone.querySelector('.placed-item img');
      if (!placed || !placed.complete) return;

      var nw = placed.naturalWidth;
      var nh = placed.naturalHeight;
      if (!nw || !nh) return;

      var left = parsePercent(zone.style.left);
      var top = parsePercent(zone.style.top);
      var width = parsePercent(zone.style.width);
      var height = parsePercent(zone.style.height);
      var x = left * w;
      var y = top * h;
      var sw = width * w;
      var sh = height * h;

      var scale = Math.min(sw / nw, sh / nh);
      var drawW = nw * scale;
      var drawH = nh * scale;
      var dx = x + (sw - drawW) / 2;
      var dy = y + (sh - drawH) / 2;
      ctx.drawImage(placed, 0, 0, nw, nh, dx, titleHeight + dy, drawW, drawH);
    });

    try {
      var dataUrl = canvas.toDataURL('image/png');
      var link = document.createElement('a');
      link.download = 'chromatic-anomaly-outfit.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('error');
    }
  }

  function hasDress() {
    var zone = document.getElementById('zone-dress');
    return zone && zone.querySelector('.placed-item');
  }

  function hasShirtOrBottom() {
    var shirt = document.getElementById('zone-shirt');
    var bottom = document.getElementById('zone-bottom');
    return (shirt && shirt.querySelector('.placed-item')) || (bottom && bottom.querySelector('.placed-item'));
  }

  function canDropInZone(zone, category) {
    if (!zone || zone.getAttribute('data-category') !== category) return false;
    return true;
  }

  function setDragImageFromImage(e, imgEl, offsetX, offsetY) {
    var size = 80;
    var x = Math.min(size - 1, Math.max(0, offsetX));
    var y = Math.min(size - 1, Math.max(0, offsetY));
    function useCanvas(canvas) {
      canvas.style.position = 'fixed';
      canvas.style.left = '-9999px';
      canvas.style.top = '0';
      document.body.appendChild(canvas);
      e.dataTransfer.setDragImage(canvas, x, y);
      setTimeout(function () { canvas.remove(); }, 0);
    }
    try {
      if (!imgEl || !imgEl.complete || !imgEl.naturalWidth) return;
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(imgEl, 0, 0, size, size);
      useCanvas(canvas);
    } catch (err) {
      try {
        var fallback = document.createElement('canvas');
        fallback.width = size;
        fallback.height = size;
        var ctx2 = fallback.getContext('2d');
        ctx2.fillStyle = '#ffe4e9';
        ctx2.fillRect(0, 0, size, size);
        ctx2.strokeStyle = '#ff69b4';
        ctx2.lineWidth = 2;
        ctx2.strokeRect(1, 1, size - 2, size - 2);
        useCanvas(fallback);
      } catch (e2) {}
    }
  }

  function raiseZonesForCategory(category) {
    var zoneDress = document.getElementById('zone-dress');
    var zoneShirt = document.getElementById('zone-shirt');
    var zoneBottom = document.getElementById('zone-bottom');
    if (zoneDress) zoneDress.classList.remove('zone-drag-top');
    if (zoneShirt) zoneShirt.classList.remove('zone-drag-top');
    if (zoneBottom) zoneBottom.classList.remove('zone-drag-top');
    if (category === 'dress' && zoneDress) zoneDress.classList.add('zone-drag-top');
    if (category === 'shirt' && zoneShirt) zoneShirt.classList.add('zone-drag-top');
    if (category === 'bottom' && zoneBottom) zoneBottom.classList.add('zone-drag-top');
  }

  function onDragStart(e) {
    var placedItem = e.target.closest('.placed-item');
    if (placedItem) {
      draggedPlacedItem = placedItem;
      draggedPlacedCategory = placedItem.closest('.drop-zone').getAttribute('data-category');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/placed-item', 'true');
      e.dataTransfer.setData('application/category', draggedPlacedCategory);
      var img = placedItem.querySelector('img');
      if (img) setDragImageFromImage(e, img, 40, 40);
      placedItem.classList.add('dragging');
      raiseZonesForCategory(draggedPlacedCategory);
      return;
    }

    var item = e.target.closest('.clothing-item');
    if (!item) return;
    draggedSrc = item.getAttribute('data-src');
    draggedCategory = item.getAttribute('data-category');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', draggedSrc);
    e.dataTransfer.setData('application/category', draggedCategory);
    var img = item.querySelector('img');
    if (img) setDragImageFromImage(e, img, 40, 40);
    item.classList.add('dragging');
    raiseZonesForCategory(draggedCategory);
  }

  function onDragEnd(e) {
    var item = e.target.closest('.clothing-item');
    if (item) item.classList.remove('dragging');

    var placedItem = e.target.closest('.placed-item');
    if (placedItem) placedItem.classList.remove('dragging');

    raiseZonesForCategory(null);
    updateDressZoneTop();

    draggedSrc = null;
    draggedCategory = null;
    draggedPlacedItem = null;
    draggedPlacedCategory = null;
  }

  function onDragOver(e) {
    e.preventDefault();
    var zone = e.target.closest('.drop-zone');
    var isPlacedItem = e.dataTransfer.types.includes('application/placed-item');
    var category = isPlacedItem ? draggedPlacedCategory : draggedCategory;

    if (isPlacedItem) {
      e.dataTransfer.dropEffect = 'move';
      if (zone && canDropInZone(zone, category)) zone.classList.add('drag-over');
    } else if (zone && canDropInZone(zone, draggedCategory)) {
      e.dataTransfer.dropEffect = 'copy';
      zone.classList.add('drag-over');
    }
  }

  function onDragLeave(e) {
    var zone = e.target.closest('.drop-zone');
    if (zone) zone.classList.remove('drag-over');
  }

  function performDrop(zone) {
    zone.classList.remove('drag-over');
    if (draggedPlacedItem) {
      var category = draggedPlacedCategory;
      if (!canDropInZone(zone, category)) {
        draggedPlacedItem = null;
        return;
      }
      if (category === 'dress') {
        var shirtZone = document.getElementById('zone-shirt');
        var bottomZone = document.getElementById('zone-bottom');
        if (shirtZone) { var ex = shirtZone.querySelector('.placed-item'); if (ex) ex.remove(); }
        if (bottomZone) { var ex2 = bottomZone.querySelector('.placed-item'); if (ex2) ex2.remove(); }
      } else if (category === 'shirt' || category === 'bottom') {
        var dressZone = document.getElementById('zone-dress');
        if (dressZone) { var ex3 = dressZone.querySelector('.placed-item'); if (ex3) ex3.remove(); }
      }
      var existingInZone = zone.querySelector('.placed-item');
      if (existingInZone) existingInZone.remove();
      zone.appendChild(draggedPlacedItem);
      draggedPlacedItem = null;
      updateDressZoneTop();
      return;
    }
    if (!draggedSrc) return;
    var zoneCategory = zone.getAttribute('data-category');
    if (!canDropInZone(zone, draggedCategory) || zoneCategory !== draggedCategory) return;
    var src = draggedSrc;
    if (draggedCategory === 'dress') {
      var sz = document.getElementById('zone-shirt');
      var bz = document.getElementById('zone-bottom');
      if (sz) { var e1 = sz.querySelector('.placed-item'); if (e1) e1.remove(); }
      if (bz) { var e2 = bz.querySelector('.placed-item'); if (e2) e2.remove(); }
    } else if (draggedCategory === 'shirt' || draggedCategory === 'bottom') {
      var dz = document.getElementById('zone-dress');
      if (dz) { var e3 = dz.querySelector('.placed-item'); if (e3) e3.remove(); }
    }
    var existing = zone.querySelector('.placed-item');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'placed-item';
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', onDragStart);
    div.addEventListener('dragend', onDragEnd);
    div.addEventListener('touchstart', onTouchStart, { passive: false });
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Placed clothing';
    div.appendChild(img);
    zone.appendChild(div);
    updateDressZoneTop();
  }

  function performDropOutside() {
    if (draggedPlacedItem) {
      draggedPlacedItem.remove();
      draggedPlacedItem = null;
      updateDressZoneTop();
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    var zone = e.target.closest('.drop-zone');
    if (!zone) return;
    if (e.dataTransfer) {
      draggedSrc = e.dataTransfer.getData('text/plain') || draggedSrc;
    }
    performDrop(zone);
  }

  function onDocumentDragOver(e) {
    if (e.dataTransfer.types.includes('application/placed-item')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function onDocumentDrop(e) {
    var isPlacedItem = e.dataTransfer.getData('application/placed-item') === 'true';
    if (isPlacedItem && draggedPlacedItem) {
      e.preventDefault();
      var zone = e.target.closest('.drop-zone');
      if (!zone) performDropOutside();
    }
  }

  function onTouchStart(e) {
    var placedItem = e.target.closest('.placed-item');
    var item = e.target.closest('.clothing-item');
    if (placedItem) {
      e.preventDefault();
      draggedPlacedItem = placedItem;
      draggedPlacedCategory = placedItem.closest('.drop-zone').getAttribute('data-category');
      draggedSrc = null;
      draggedCategory = null;
      var img = placedItem.querySelector('img');
      createTouchGhost(img ? img.src : null);
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      moveTouchGhost(lastTouchX, lastTouchY);
      raiseZonesForCategory(draggedPlacedCategory);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd, { passive: false });
      document.addEventListener('touchcancel', onTouchEnd, { passive: false });
      return;
    }
    if (item) {
      e.preventDefault();
      draggedSrc = item.getAttribute('data-src');
      draggedCategory = item.getAttribute('data-category');
      draggedPlacedItem = null;
      draggedPlacedCategory = null;
      var img = item.querySelector('img');
      createTouchGhost(img ? img.src : null);
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      moveTouchGhost(lastTouchX, lastTouchY);
      raiseZonesForCategory(draggedCategory);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd, { passive: false });
      document.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }
  }

  function createTouchGhost(src) {
    removeTouchGhost();
    touchGhost = document.createElement('div');
    touchGhost.className = 'touch-drag-ghost';
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      touchGhost.appendChild(img);
    }
    document.body.appendChild(touchGhost);
  }

  function moveTouchGhost(x, y) {
    if (!touchGhost) return;
    touchGhost.style.left = x + 'px';
    touchGhost.style.top = y + 'px';
  }

  function removeTouchGhost() {
    if (touchGhost && touchGhost.parentNode) touchGhost.parentNode.removeChild(touchGhost);
    touchGhost = null;
  }

  function onTouchMove(e) {
    if (e.touches.length) {
      e.preventDefault();
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      moveTouchGhost(lastTouchX, lastTouchY);
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    removeTouchGhost();
    var zone = null;
    var el = document.elementFromPoint(lastTouchX, lastTouchY);
    if (el) zone = el.closest('.drop-zone');
    if (zone) performDrop(zone);
    else performDropOutside();
    draggedSrc = null;
    draggedCategory = null;
    draggedPlacedItem = null;
    draggedPlacedCategory = null;
    raiseZonesForCategory(null);
    updateDressZoneTop();
  }
// Mau is pretty :3
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
