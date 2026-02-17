// FUCK YOU JAVASCRIPT!!!!!!
(function () {
  var draggedSrc = null;
  var draggedCategory = null;
  var draggedPlacedItem = null;

  function init() {
    var items = document.querySelectorAll('.clothing-item[draggable="true"]');
    var zones = document.querySelectorAll('.drop-zone');

    items.forEach(function (el) {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
    });

    zones.forEach(function (zone) {
      zone.addEventListener('dragover', onDragOver);
      zone.addEventListener('dragleave', onDragLeave);
      zone.addEventListener('drop', onDrop);
    });

    document.addEventListener('drop', onDocumentDrop);
    document.addEventListener('dragover', onDocumentDragOver);
  }

  function onDragStart(e) {
    var placedItem = e.target.closest('.placed-item');
    if (placedItem) {
      draggedPlacedItem = placedItem;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/placed-item', 'true');
      placedItem.classList.add('dragging');
      return;
    }

    var item = e.target.closest('.clothing-item');
    if (!item) return;
    draggedSrc = item.getAttribute('data-src');
    draggedCategory = item.getAttribute('data-category');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', draggedSrc);
    e.dataTransfer.setData('application/category', draggedCategory);
    item.classList.add('dragging');
  }

  function onDragEnd(e) {
    var item = e.target.closest('.clothing-item');
    if (item) item.classList.remove('dragging');
    
    var placedItem = e.target.closest('.placed-item');
    if (placedItem) placedItem.classList.remove('dragging');
    
    draggedSrc = null;
    draggedCategory = null;
    draggedPlacedItem = null;
  }

  function onDragOver(e) {
    e.preventDefault();
    var zone = e.target.closest('.drop-zone');
    var isPlacedItem = e.dataTransfer.types.includes('application/placed-item');
    
    if (isPlacedItem) {
      e.dataTransfer.dropEffect = 'move';
      if (zone) zone.classList.add('drag-over');
    } else if (zone && zone.getAttribute('data-category') === draggedCategory) {
      e.dataTransfer.dropEffect = 'copy';
      zone.classList.add('drag-over');
    }
  }

  function onDragLeave(e) {
    var zone = e.target.closest('.drop-zone');
    if (zone) zone.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation(); 
    var zone = e.target.closest('.drop-zone');
    if (!zone) return;
    zone.classList.remove('drag-over');

    var isPlacedItem = e.dataTransfer.getData('application/placed-item') === 'true';
    if (isPlacedItem) {
      draggedPlacedItem = null;
      return;
    }

    var zoneCategory = zone.getAttribute('data-category');
    if (zoneCategory !== draggedCategory) return;

    var src = e.dataTransfer.getData('text/plain');
    if (!src) return;

    var existing = zone.querySelector('.placed-item');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.className = 'placed-item';
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', onDragStart);
    div.addEventListener('dragend', onDragEnd);
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Placed clothing';
    div.appendChild(img);
    zone.appendChild(div);
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
      if (!zone && draggedPlacedItem) {
        draggedPlacedItem.remove();
        draggedPlacedItem = null;
      }
    }
  }
// Mau is pretty :3
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
