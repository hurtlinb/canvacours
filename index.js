const http = require('http');
const { version } = require('./package.json');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Canvas de cours - Gestion des activités</title>
      <style>
        :root {
          --blue-50: #f0f6ff;
          --blue-100: #dcecff;
          --blue-200: #bfdcff;
          --blue-300: #8ec4ff;
          --blue-400: #5aaaff;
          --blue-500: #2f8bff;
          --blue-600: #1c6fd6;
          --grey-900: #1f2a36;
          --grey-700: #2f3c4a;
          --grey-500: #60718a;
          --grey-200: #d6dce8;
          --white: #ffffff;
          --shadow-md: 0 12px 30px rgba(47, 139, 255, 0.15);
          --shadow-sm: 0 6px 16px rgba(47, 139, 255, 0.1);
          --radius-lg: 18px;
          --radius-md: 12px;
          --radius-sm: 8px;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
          background: var(--blue-50);
          color: var(--grey-700);
          line-height: 1.6;
        }

        body.modal-open {
          overflow: hidden;
        }

        .app-header {
          background: linear-gradient(135deg, var(--blue-400), var(--blue-600));
          color: var(--white);
          padding: 3.5rem 1.5rem 5rem;
        }

        .header-content {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
        }

        .header-text {
          max-width: 640px;
        }

        .app-header h1 {
          margin: 0 0 0.5rem;
          font-size: 2.75rem;
        }

        .app-subtitle {
          margin: 0;
          font-size: 1.1rem;
          max-width: 460px;
        }

        .page-content {
          max-width: 1200px;
          margin: -3rem auto 4rem;
          padding: 0 1.5rem 4rem;
        }

        .board {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .week-column {
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          min-height: 360px;
          border: 1px solid rgba(90, 170, 255, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .week-column.is-drop-target {
          border-color: var(--blue-500);
          box-shadow: 0 0 0 3px rgba(47, 139, 255, 0.25);
          transform: translateY(-4px);
        }

        .week-column:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(47, 139, 255, 0.25);
        }

        .week-header {
          padding: 1.25rem 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(90, 170, 255, 0.2);
        }

        .week-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--grey-900);
        }

        .week-header .btn-secondary {
          align-self: flex-start;
        }

        .week-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .week-date-picker {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          align-items: flex-start;
        }

        .week-date-picker span {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--grey-500);
        }

        .week-date-picker input {
          border-radius: var(--radius-md);
          border: 1px solid rgba(47, 139, 255, 0.35);
          padding: 0.55rem 0.75rem;
          font-size: 0.95rem;
          font-family: inherit;
          background: rgba(247, 251, 255, 0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .week-date-picker input:focus {
          outline: none;
          border-color: var(--blue-500);
          box-shadow: 0 0 0 3px rgba(47, 139, 255, 0.25);
        }

        .week-slots {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          flex: 1;
        }

        .slot-section {
          background: rgba(240, 246, 255, 0.65);
          border: 1px solid rgba(90, 170, 255, 0.25);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .slot-section.is-drop-target {
          border-color: var(--blue-500);
          box-shadow: 0 0 0 3px rgba(47, 139, 255, 0.18);
        }

        .slot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .slot-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .slot-title {
          font-weight: 700;
          font-size: 1rem;
          color: var(--grey-900);
        }

        .slot-subtitle {
          font-size: 0.85rem;
          color: var(--grey-500);
        }

        .slot-activities {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 52px;
          padding: 0.25rem;
          border-radius: var(--radius-md);
          transition: background 0.2s ease;
        }

        .slot-activities.is-drop-target {
          background: rgba(47, 139, 255, 0.08);
        }

        .empty-state {
          margin: 0;
          padding: 1.25rem;
          background: var(--blue-100);
          border-radius: var(--radius-md);
          color: var(--grey-500);
          text-align: center;
          border: 1px dashed rgba(47, 139, 255, 0.4);
        }

        .slot-activities .empty-state {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(47, 139, 255, 0.35);
          font-size: 0.9rem;
          pointer-events: none;
        }

        .activity-card {
          background: linear-gradient(180deg, rgba(243, 249, 255, 0.95), rgba(226, 240, 255, 0.95));
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          box-shadow: var(--shadow-sm);
          border-left: 4px solid rgba(47, 139, 255, 0.4);
          cursor: grab;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .activity-card p {
          line-height: 1.45;
        }

        .activity-card:active {
          cursor: grabbing;
        }

        .activity-card.is-dragging {
          opacity: 0.6;
          box-shadow: none;
        }

        .activity-card.is-drop-target {
          box-shadow: var(--shadow-sm);
        }

        .activity-card.is-drop-before {
          box-shadow: inset 0 3px 0 var(--blue-500), var(--shadow-sm);
        }

        .activity-card.is-drop-after {
          box-shadow: inset 0 -3px 0 var(--blue-500), var(--shadow-sm);
        }

        .activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(47, 139, 255, 0.2);
        }

        .activity-top {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .activity-summary {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
          min-width: 0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          font-size: 1rem;
          background: rgba(90, 170, 255, 0.22);
          color: var(--grey-900);
          flex-shrink: 0;
        }

        .badge::before {
          content: none;
        }

        .badge-presentation {
          background: rgba(108, 181, 255, 0.25);
          color: #17507e;
        }

        .badge-exercice {
          background: rgba(82, 168, 236, 0.25);
          color: #184c72;
        }

        .badge-evaluation {
          background: rgba(66, 150, 214, 0.25);
          color: #153f61;
        }

        .badge-groupe {
          background: rgba(54, 136, 199, 0.25);
          color: #123651;
        }

        .activity-description {
          margin: 0;
          color: var(--grey-700);
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .activity-material {
          margin: 0.5rem 0 0.25rem;
          font-size: 0.85rem;
          color: var(--grey-500);
          font-weight: 600;
          word-break: break-word;
        }

        .activity-duration {
          margin: 0;
          font-size: 0.85rem;
          color: var(--blue-600);
          font-weight: 600;
        }

        .activity-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.25rem;
        }

        .btn-tertiary {
          background: transparent;
          border: none;
          color: var(--blue-600);
          font-weight: 600;
          padding: 0.35rem 0.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .btn-tertiary:hover {
          background: rgba(47, 139, 255, 0.1);
          color: var(--blue-500);
        }

        .btn-slot-add {
          border: 1px dashed rgba(47, 139, 255, 0.45);
          border-radius: 999px;
          padding: 0.4rem 0.9rem;
          font-size: 0.85rem;
          background: rgba(255, 255, 255, 0.7);
        }

        .btn-slot-add:hover {
          background: rgba(47, 139, 255, 0.12);
        }

        .btn-primary,
        .btn-secondary {
          border: none;
          border-radius: 999px;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--blue-500), var(--blue-600));
          color: var(--white);
          box-shadow: 0 12px 24px rgba(47, 139, 255, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 6px 12px rgba(47, 139, 255, 0.25);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.95);
          color: var(--blue-600);
          border: 1px solid rgba(47, 139, 255, 0.3);
          box-shadow: 0 10px 20px rgba(47, 139, 255, 0.15);
        }

        .btn-secondary:hover {
          filter: brightness(1.08);
        }

        .btn-secondary:active {
          transform: translateY(1px);
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(15, 38, 77, 0.35);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 20;
        }

        .modal.is-open {
          display: flex;
        }

        .modal-content {
          background: var(--white);
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(15, 38, 77, 0.2);
          padding: 2rem;
          width: min(480px, 100%);
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(47, 139, 255, 0.1);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.5rem;
          color: var(--blue-600);
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(47, 139, 255, 0.18);
        }

        #form-title {
          margin-top: 0;
          color: var(--grey-900);
          font-size: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 1rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--grey-700);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          border-radius: var(--radius-md);
          border: 1px solid rgba(47, 139, 255, 0.35);
          padding: 0.65rem 0.75rem;
          font-size: 1rem;
          font-family: inherit;
          background: rgba(247, 251, 255, 0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--blue-500);
          box-shadow: 0 0 0 3px rgba(47, 139, 255, 0.25);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 110px;
        }

        .form-helper {
          margin: 0;
          font-size: 0.85rem;
          color: var(--grey-500);
          line-height: 1.4;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          align-items: center;
          margin-top: 1.5rem;
        }

        .app-footer {
          text-align: center;
          color: var(--grey-500);
          padding: 2rem 1.5rem 3rem;
          font-size: 0.9rem;
        }

        @media (max-width: 900px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .app-header h1 {
            font-size: 2.25rem;
          }

          .page-content {
            margin-top: -2.5rem;
          }
        }

        @media (max-width: 600px) {
          .board {
            gap: 1rem;
          }

          .app-header {
            padding-bottom: 4rem;
          }

          .page-content {
            padding: 0 1rem 3rem;
          }

          .modal-content {
            padding: 1.5rem;
          }
        }
      </style>
    </head>
    <body>
      <header class="app-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Canvas de cours</h1>
          </div>
        </div>
      </header>
      <main class="page-content">
        <section class="board" id="weeks-board" aria-live="polite"></section>
      </main>
      <footer class="app-footer">
        <p>v${version}</p>
      </footer>
      <div class="modal" id="activity-modal" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <button type="button" class="modal-close" data-action="close-modal" aria-label="Fermer le formulaire">&times;</button>
          <h2 id="form-title">Ajouter une activité</h2>
          <form id="activity-form">
            <input type="hidden" name="activityId" id="activity-id" />
            <input type="hidden" name="weekId" id="week-id" value="" />
            <div class="form-group">
              <label for="slot">Demi-journée</label>
              <select id="slot" name="slot" required></select>
              <p class="form-helper" id="slot-helper">
                La date affichée pour l'activité sera calculée automatiquement en fonction du créneau choisi.
              </p>
            </div>
            <div class="form-group">
              <label for="activity-type">Type d'activité</label>
              <select id="activity-type" name="activityType" required>
                <option value="presentation">🎤 Présentation</option>
                <option value="exercice">📝 Exercice</option>
                <option value="evaluation">📊 Évaluation</option>
                <option value="groupe">🤝 Travail de groupe</option>
              </select>
            </div>
            <div class="form-group">
              <label for="duration">Temps prévu</label>
              <input id="duration" name="duration" type="text" placeholder="Ex. 2h, 45 minutes" />
            </div>
            <div class="form-group">
              <label for="material">Matériel</label>
              <input id="material" name="material" type="text" placeholder="Ex. diaporama_introduction.pdf" />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="4" placeholder="Décrivez le déroulement de l'activité" required></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Enregistrer</button>
              <button type="button" class="btn-tertiary" data-action="close-modal">Annuler</button>
            </div>
          </form>
        </div>
      </div>
      <script>
        (function () {
          'use strict';

          var storageKey = 'course-canvas-v1';
          var defaultWeeks = Array.from({ length: 5 }, function (_, index) {
            return {
              id: 'week-' + (index + 1),
              name: 'Semaine ' + (index + 1),
              startDate: '',
              activities: []
            };
          });

          var typeLabels = {
            presentation: 'Présentation',
            exercice: 'Exercice',
            evaluation: 'Évaluation',
            groupe: 'Travail de groupe'
          };

          var typeIcons = {
            presentation: '🎤',
            exercice: '📝',
            evaluation: '📊',
            groupe: '🤝'
          };

          var halfDaySlots = [
            { id: 'monday-am', label: 'Matin', dayLabel: 'Lundi', dayOffset: 0 },
            { id: 'monday-pm', label: 'Après-midi', dayLabel: 'Lundi', dayOffset: 0 },
            { id: 'tuesday-am', label: 'Matin', dayLabel: 'Mardi', dayOffset: 1 },
            { id: 'tuesday-pm', label: 'Après-midi', dayLabel: 'Mardi', dayOffset: 1 },
            { id: 'wednesday-am', label: 'Matin', dayLabel: 'Mercredi', dayOffset: 2 },
            { id: 'wednesday-pm', label: 'Après-midi', dayLabel: 'Mercredi', dayOffset: 2 },
            { id: 'thursday-am', label: 'Matin', dayLabel: 'Jeudi', dayOffset: 3 },
            { id: 'thursday-pm', label: 'Après-midi', dayLabel: 'Jeudi', dayOffset: 3 },
            { id: 'friday-am', label: 'Matin', dayLabel: 'Vendredi', dayOffset: 4 },
            { id: 'friday-pm', label: 'Après-midi', dayLabel: 'Vendredi', dayOffset: 4 }
          ];

          var halfDaySlotMap = halfDaySlots.reduce(function (accumulator, slot) {
            accumulator[slot.id] = slot;
            return accumulator;
          }, {});

          var slotHelperDefaultText =
            "La date affichée pour l'activité sera calculée automatiquement en fonction du créneau choisi.";

          var board = document.getElementById('weeks-board');
          var modal = document.getElementById('activity-modal');
          var form = document.getElementById('activity-form');
          var formTitle = document.getElementById('form-title');
          var weekIdInput = document.getElementById('week-id');
          var slotSelect = document.getElementById('slot');
          var slotHelper = document.getElementById('slot-helper');
          if (slotHelper) {
            if (slotHelper.textContent && slotHelper.textContent.trim()) {
              slotHelperDefaultText = slotHelper.textContent.trim();
            } else {
              slotHelper.textContent = slotHelperDefaultText;
            }
          }
          var typeSelect = document.getElementById('activity-type');
          var durationInput = document.getElementById('duration');
          var materialInput = document.getElementById('material');
          var descriptionInput = document.getElementById('description');
          var activityIdInput = document.getElementById('activity-id');
          var modalCloseButtons = modal.querySelectorAll('[data-action="close-modal"]');
          var draggedActivityId = null;
          var courseData = loadData();

          initializeSlotOptions();
          updateSlotHelper();
          renderBoard();

          if (slotSelect) {
            slotSelect.addEventListener('change', updateSlotHelper);
          }

          board.addEventListener('click', function (event) {
            var addTrigger = event.target.closest('[data-action="add-activity"]');
            if (addTrigger) {
              var addWeekId = addTrigger.getAttribute('data-week-id');
              var addSlotId = addTrigger.getAttribute('data-slot-id');
              openForm('create', { weekId: addWeekId, slotId: addSlotId });
              return;
            }

            var editTrigger = event.target.closest('[data-action="edit-activity"]');
            if (editTrigger) {
              var editWeekId = editTrigger.getAttribute('data-week-id');
              var editActivityId = editTrigger.getAttribute('data-activity-id');
              var week = courseData.find(function (item) {
                return item.id === editWeekId;
              });
              if (!week) {
                return;
              }
              var activity = week.activities.find(function (item) {
                return item.id === editActivityId;
              });
              if (!activity) {
                return;
              }
              openForm('edit', { weekId: editWeekId, activity: activity });
            }
          });

          Array.prototype.forEach.call(modalCloseButtons, function (button) {
            button.addEventListener('click', function () {
              closeForm();
            });
          });

          modal.addEventListener('click', function (event) {
            if (event.target === modal) {
              closeForm();
            }
          });

          document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && modal.classList.contains('is-open')) {
              closeForm();
            }
          });

          form.addEventListener('submit', function (event) {
            event.preventDefault();
            var formData = new FormData(form);
            var activityId = formData.get('activityId');
            var selectedWeekId = formData.get('weekId');
            var payload = {
              id: activityId || generateId(),
              slot: formData.get('slot'),
              type: formData.get('activityType'),
              duration: (formData.get('duration') || '').trim(),
              material: (formData.get('material') || '').trim(),
              description: (formData.get('description') || '').trim()
            };

            payload.slot = normalizeSlotId(payload.slot);

            if (!payload.description) {
              return;
            }

            var operationSucceeded = false;
            if (activityId) {
              operationSucceeded = updateActivity(activityId, selectedWeekId, payload);
            } else {
              operationSucceeded = addActivity(selectedWeekId, payload);
            }

            if (operationSucceeded) {
              closeForm();
            }
          });

          function renderBoard() {
            while (board.firstChild) {
              board.removeChild(board.firstChild);
            }
            courseData.forEach(function (week) {
              var column = createWeekColumn(week);
              board.appendChild(column);
            });
            updateSlotHelper();
          }

          function createWeekColumn(week) {
            refreshWeekActivitiesDates(week);
            var column = document.createElement('section');
            column.className = 'week-column';
            column.setAttribute('data-week-id', week.id);

            var header = document.createElement('header');
            header.className = 'week-header';

            var titleRow = document.createElement('div');
            titleRow.className = 'week-title-row';

            var title = document.createElement('h2');
            title.textContent = week.name;

            titleRow.appendChild(title);

            var datePicker = document.createElement('label');
            datePicker.className = 'week-date-picker';

            var dateLabel = document.createElement('span');
            dateLabel.textContent = 'Date de début';

            var dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = week.startDate || '';
            dateInput.addEventListener('change', function (event) {
              var normalized = sanitizeDateString(event.target.value);
              week.startDate = normalized;
              event.target.value = normalized;
              refreshWeekActivitiesDates(week);
              saveData();
              renderBoard();
              updateSlotHelper();
            });

            datePicker.appendChild(dateLabel);
            datePicker.appendChild(dateInput);

            header.appendChild(titleRow);
            header.appendChild(datePicker);

            var slotsWrapper = document.createElement('div');
            slotsWrapper.className = 'week-slots';

            halfDaySlots.forEach(function (slot) {
              var slotSection = document.createElement('section');
              slotSection.className = 'slot-section';
              slotSection.setAttribute('data-week-id', week.id);
              slotSection.setAttribute('data-slot-id', slot.id);

              var slotHeader = document.createElement('div');
              slotHeader.className = 'slot-header';

              var slotInfo = document.createElement('div');
              slotInfo.className = 'slot-info';

              var slotTitle = document.createElement('span');
              slotTitle.className = 'slot-title';
              slotTitle.textContent = slot.label;

              var slotSubtitle = document.createElement('span');
              slotSubtitle.className = 'slot-subtitle';
              slotSubtitle.textContent = formatSlotSubtitle(week, slot.id);

              slotInfo.appendChild(slotTitle);
              slotInfo.appendChild(slotSubtitle);

              var slotAddButton = document.createElement('button');
              slotAddButton.type = 'button';
              slotAddButton.className = 'btn-tertiary btn-slot-add';
              slotAddButton.setAttribute('data-action', 'add-activity');
              slotAddButton.setAttribute('data-week-id', week.id);
              slotAddButton.setAttribute('data-slot-id', slot.id);
              slotAddButton.textContent = 'Ajouter';

              slotHeader.appendChild(slotInfo);
              slotHeader.appendChild(slotAddButton);

              var slotList = document.createElement('div');
              slotList.className = 'slot-activities';
              slotList.setAttribute('data-week-id', week.id);
              slotList.setAttribute('data-slot-id', slot.id);

              var slotActivities = week.activities.filter(function (activity) {
                return activity.slot === slot.id;
              });

              if (slotActivities.length === 0) {
                var empty = document.createElement('p');
                empty.className = 'empty-state';
                empty.textContent = 'Aucune activité planifiée pour cette demi-journée.';
                slotList.appendChild(empty);
              } else {
                slotActivities.forEach(function (activity) {
                  slotList.appendChild(createActivityCard(activity, week));
                });
              }

              slotList.addEventListener('dragover', handleSlotDragOver);
              slotList.addEventListener('dragleave', handleSlotDragLeave);
              slotList.addEventListener('drop', handleSlotDrop);

              slotSection.appendChild(slotHeader);
              slotSection.appendChild(slotList);

              slotsWrapper.appendChild(slotSection);
            });

            column.appendChild(header);
            column.appendChild(slotsWrapper);

            return column;
          }

          function createActivityCard(activity, week) {
            var card = document.createElement('article');
            card.className = 'activity-card';
            card.setAttribute('data-activity-id', activity.id);
            card.setAttribute('data-week-id', week.id);
            card.setAttribute('data-slot-id', activity.slot);
            card.draggable = true;

            var top = document.createElement('div');
            top.className = 'activity-top';

            var badge = document.createElement('span');
            var typeKey = activity.type && typeLabels[activity.type] ? activity.type : 'presentation';
            var badgeLabel = typeLabels[typeKey] || 'Activité';
            var badgeIcon = typeIcons[typeKey] || '🎯';
            badge.className = 'badge badge-' + typeKey;
            badge.textContent = badgeIcon;
            badge.setAttribute('role', 'img');
            badge.setAttribute('aria-label', badgeLabel);
            badge.title = badgeLabel;

            var summary = document.createElement('div');
            summary.className = 'activity-summary';

            var description = document.createElement('p');
            description.className = 'activity-description';
            description.textContent = activity.description || 'Description à préciser.';

            var duration = document.createElement('span');
            duration.className = 'activity-duration';
            duration.textContent = activity.duration
              ? '⏱ ' + activity.duration
              : '⏱ Temps à définir';

            summary.appendChild(duration);
            summary.appendChild(description);

            top.appendChild(badge);
            top.appendChild(summary);

            var material = document.createElement('p');
            material.className = 'activity-material';
            material.textContent = activity.material
              ? 'Matériel : ' + activity.material
              : 'Matériel : à préciser';

            var actions = document.createElement('div');
            actions.className = 'activity-actions';

            var editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'btn-tertiary';
            editButton.setAttribute('data-action', 'edit-activity');
            editButton.setAttribute('data-week-id', week.id);
            editButton.setAttribute('data-activity-id', activity.id);
            editButton.textContent = 'Modifier';

            actions.appendChild(editButton);

            card.appendChild(top);
            card.appendChild(material);
            card.appendChild(actions);

            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('dragover', handleCardDragOver);
            card.addEventListener('dragleave', handleCardDragLeave);
            card.addEventListener('drop', handleCardDrop);

            return card;
          }

          function handleDragStart(event) {
            var card = event.currentTarget;
            draggedActivityId = card.getAttribute('data-activity-id');
            event.dataTransfer.effectAllowed = 'move';
            try {
              event.dataTransfer.setData('text/plain', draggedActivityId);
            } catch (error) {
              // Certaines plateformes peuvent empêcher setData; on ignore l'erreur.
            }
            window.requestAnimationFrame(function () {
              card.classList.add('is-dragging');
            });
          }

          function handleDragEnd(event) {
            var card = event.currentTarget;
            card.classList.remove('is-dragging');
            draggedActivityId = null;
            clearAllSlotDropState();
          }

          function handleCardDragOver(event) {
            event.preventDefault();
            var card = event.currentTarget;
            var bounding = card.getBoundingClientRect();
            var offset = event.clientY - bounding.top;
            var isBefore = offset < bounding.height / 2;
            event.dataTransfer.dropEffect = 'move';
            card.classList.add('is-drop-target');
            card.classList.toggle('is-drop-before', isBefore);
            card.classList.toggle('is-drop-after', !isBefore);
            var slotContainer = getSlotContainer(card);
            if (slotContainer) {
              slotContainer.classList.add('is-drop-target');
            }
          }

          function handleCardDragLeave(event) {
            var card = event.currentTarget;
            if (event.relatedTarget && card.contains(event.relatedTarget)) {
              return;
            }
            clearCardDropState(card);
            var slotContainer = getSlotContainer(card);
            if (
              slotContainer &&
              (!event.relatedTarget || !slotContainer.contains(event.relatedTarget))
            ) {
              slotContainer.classList.remove('is-drop-target');
            }
          }

          function handleCardDrop(event) {
            event.preventDefault();
            event.stopPropagation();
            var card = event.currentTarget;
            var targetWeekId = card.getAttribute('data-week-id');
            var targetSlotId = card.getAttribute('data-slot-id');
            var targetActivityId = card.getAttribute('data-activity-id');
            var activityId = draggedActivityId || event.dataTransfer.getData('text/plain');
            var bounding = card.getBoundingClientRect();
            var offset = event.clientY - bounding.top;
            var isBefore = offset < bounding.height / 2;
            var slotContainer = getSlotContainer(card);
            clearCardDropState(card);
            if (slotContainer) {
              slotContainer.classList.remove('is-drop-target');
            }
            if (!activityId || !targetWeekId || !targetActivityId || !targetSlotId) {
              return;
            }
            if (activityId === targetActivityId) {
              return;
            }
            var targetWeek = courseData.find(function (week) {
              return week.id === targetWeekId;
            });
            if (!targetWeek) {
              return;
            }
            var slotActivities = targetWeek.activities.filter(function (activity) {
              return activity.slot === targetSlotId;
            });
            var targetSlotIndex = slotActivities.findIndex(function (activity) {
              return activity.id === targetActivityId;
            });
            if (targetSlotIndex === -1) {
              return;
            }
            if (!isBefore) {
              targetSlotIndex += 1;
            }
            moveActivity(activityId, targetWeekId, targetSlotId, targetSlotIndex);
            draggedActivityId = null;
          }

          function clearCardDropState(card) {
            card.classList.remove('is-drop-target', 'is-drop-before', 'is-drop-after');
          }

          function handleSlotDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            var slotList = event.currentTarget;
            slotList.classList.add('is-drop-target');
            var slotSection = slotList.parentElement;
            if (slotSection && slotSection.classList) {
              slotSection.classList.add('is-drop-target');
            }
          }

          function handleSlotDragLeave(event) {
            var slotList = event.currentTarget;
            if (event.relatedTarget && slotList.contains(event.relatedTarget)) {
              return;
            }
            clearSlotDropState(slotList);
          }

          function handleSlotDrop(event) {
            event.preventDefault();
            var slotList = event.currentTarget;
            var targetWeekId = slotList.getAttribute('data-week-id');
            var targetSlotId = slotList.getAttribute('data-slot-id');
            var activityId = draggedActivityId || event.dataTransfer.getData('text/plain');
            clearSlotDropState(slotList);
            if (!activityId || !targetWeekId || !targetSlotId) {
              return;
            }
            var slotIndex = countSlotActivitiesForWeek(targetWeekId, targetSlotId);
            moveActivity(activityId, targetWeekId, targetSlotId, slotIndex);
            draggedActivityId = null;
          }

          function clearSlotDropState(slotList) {
            slotList.classList.remove('is-drop-target');
            var slotSection = slotList.parentElement;
            if (slotSection && slotSection.classList) {
              slotSection.classList.remove('is-drop-target');
            }
          }

          function clearAllSlotDropState() {
            var elements = board.querySelectorAll(
              '.slot-activities.is-drop-target, .slot-section.is-drop-target'
            );
            Array.prototype.forEach.call(elements, function (element) {
              element.classList.remove('is-drop-target');
            });
          }

          function getSlotContainer(element) {
            var current = element;
            while (current && current !== board) {
              if (current.classList && current.classList.contains('slot-activities')) {
                return current;
              }
              current = current.parentElement;
            }
            return null;
          }

          function moveActivity(activityId, targetWeekId, targetSlotId, targetSlotIndex) {
            if (!activityId || !targetWeekId) {
              return false;
            }
            var sourceWeek = findWeekByActivityId(activityId);
            if (!sourceWeek) {
              return false;
            }
            var activityIndex = sourceWeek.activities.findIndex(function (item) {
              return item.id === activityId;
            });
            if (activityIndex === -1) {
              return false;
            }
            var targetWeek = courseData.find(function (week) {
              return week.id === targetWeekId;
            });
            if (!targetWeek) {
              return false;
            }
            var sourceActivity = sourceWeek.activities[activityIndex];
            var sourceSlotId = normalizeSlotId(sourceActivity.slot);
            var sourceSlotIndex = getSlotIndexInActivities(
              sourceWeek.activities,
              sourceSlotId,
              activityId
            );
            var normalizedTargetSlotId = normalizeSlotId(targetSlotId || sourceSlotId);
            var sanitizedActivity = sanitizeActivity(
              {
                id: sourceActivity.id,
                slot: normalizedTargetSlotId,
                type: sourceActivity.type,
                duration: sourceActivity.duration,
                material: sourceActivity.material,
                description: sourceActivity.description
              },
              targetWeek.startDate
            );
            if (!sanitizedActivity) {
              return false;
            }
            if (typeof targetSlotIndex !== 'number' || targetSlotIndex < 0) {
              targetSlotIndex = countSlotActivities(
                targetWeek.activities,
                normalizedTargetSlotId
              );
            }
            sourceWeek.activities.splice(activityIndex, 1);
            if (
              sourceWeek.id === targetWeek.id &&
              normalizedTargetSlotId === sourceSlotId &&
              targetSlotIndex > sourceSlotIndex
            ) {
              targetSlotIndex -= 1;
            }
            insertActivityInSlot(
              targetWeek.activities,
              sanitizedActivity,
              normalizedTargetSlotId,
              targetSlotIndex
            );
            persistState();
            return true;
          }

          function addActivity(weekId, activity) {
            if (!weekId) {
              return false;
            }
            var targetWeek = courseData.find(function (week) {
              return week.id === weekId;
            });
            if (!targetWeek) {
              return false;
            }
            var sanitizedActivity = sanitizeActivity(activity, targetWeek.startDate);
            if (!sanitizedActivity) {
              return false;
            }
            insertActivityInSlot(
              targetWeek.activities,
              sanitizedActivity,
              sanitizedActivity.slot
            );
            persistState();
            return true;
          }

          function updateActivity(activityId, newWeekId, updatedData) {
            if (!activityId || !newWeekId) {
              return false;
            }
            var originWeek = findWeekByActivityId(activityId);
            if (!originWeek) {
              return false;
            }
            var activityIndex = originWeek.activities.findIndex(function (item) {
              return item.id === activityId;
            });
            if (activityIndex === -1) {
              return false;
            }
            var destinationWeek = courseData.find(function (week) {
              return week.id === newWeekId;
            });
            if (!destinationWeek) {
              return false;
            }
            var originalActivity = originWeek.activities[activityIndex];
            var changes = updatedData || {};
            var mergedActivity = {
              id: activityId,
              slot:
                typeof changes.slot === 'string' && changes.slot
                  ? changes.slot
                  : originalActivity.slot,
              type:
                typeof changes.type === 'string' && changes.type
                  ? changes.type
                  : originalActivity.type,
              duration:
                typeof changes.duration === 'string'
                  ? changes.duration
                  : originalActivity.duration,
              material:
                typeof changes.material === 'string'
                  ? changes.material
                  : originalActivity.material,
              description:
                typeof changes.description === 'string'
                  ? changes.description
                  : originalActivity.description
            };
            var sanitizedActivity = sanitizeActivity(
              mergedActivity,
              destinationWeek.startDate
            );
            if (!sanitizedActivity) {
              return false;
            }
            var sourceSlotId = normalizeSlotId(originalActivity.slot);
            var sourceSlotIndex = getSlotIndexInActivities(
              originWeek.activities,
              sourceSlotId,
              activityId
            );
            originWeek.activities.splice(activityIndex, 1);
            var targetSlotIndex = sourceSlotIndex;
            if (
              destinationWeek.id !== originWeek.id ||
              sanitizedActivity.slot !== sourceSlotId
            ) {
              targetSlotIndex = countSlotActivities(
                destinationWeek.activities,
                sanitizedActivity.slot
              );
            }
            insertActivityInSlot(
              destinationWeek.activities,
              sanitizedActivity,
              sanitizedActivity.slot,
              targetSlotIndex
            );
            persistState();
            return true;
          }

          function findWeekByActivityId(activityId) {
            for (var i = 0; i < courseData.length; i += 1) {
              var week = courseData[i];
              var found = week.activities.find(function (activity) {
                return activity.id === activityId;
              });
              if (found) {
                return week;
              }
            }
            return null;
          }

          function openForm(mode, options) {
            if (!options) {
              options = {};
            }
            form.reset();
            var targetWeekId =
              typeof options.weekId === 'string' ? options.weekId : '';
            if (!targetWeekId && options.activity && options.activity.id) {
              var owningWeek = findWeekByActivityId(options.activity.id);
              if (owningWeek) {
                targetWeekId = owningWeek.id;
              }
            }
            if (weekIdInput) {
              weekIdInput.value = targetWeekId;
            }
            if (mode === 'edit' && options.activity) {
              formTitle.textContent = 'Modifier une activité';
              activityIdInput.value = options.activity.id;
              setSelectValue(slotSelect, options.activity.slot);
              typeSelect.value =
                options.activity.type && typeLabels[options.activity.type]
                  ? options.activity.type
                  : 'presentation';
              durationInput.value = options.activity.duration || '';
              materialInput.value = options.activity.material || '';
              descriptionInput.value = options.activity.description || '';
            } else {
              formTitle.textContent = 'Ajouter une activité';
              activityIdInput.value = '';
              if (typeof options.slotId === 'string' && options.slotId) {
                setSelectValue(slotSelect, options.slotId);
              } else {
                clearSelectValue(slotSelect);
              }
              typeSelect.value = 'presentation';
              materialInput.value = '';
            }
            updateSlotHelper();
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            window.setTimeout(function () {
              if (slotSelect) {
                slotSelect.focus();
              }
            }, 100);
          }

          function closeForm() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            form.reset();
            activityIdInput.value = '';
            if (weekIdInput) {
              weekIdInput.value = '';
            }
            if (slotHelper) {
              slotHelper.textContent = slotHelperDefaultText;
            }
          }

          function clearSelectValue(select) {
            if (!select) {
              return;
            }
            var placeholderOption = select.querySelector('option[value=""]');
            if (placeholderOption) {
              placeholderOption.selected = true;
            } else {
              select.selectedIndex = -1;
            }
            select.value = '';
          }

          function setSelectValue(select, value) {
            if (!select) {
              return;
            }
            if (typeof value !== 'string' || !value) {
              clearSelectValue(select);
              return;
            }
            var found = false;
            for (var i = 0; i < select.options.length; i += 1) {
              if (select.options[i].value === value) {
                select.selectedIndex = i;
                found = true;
                break;
              }
            }
            if (!found) {
              clearSelectValue(select);
            }
          }

          function loadData() {
            try {
              var raw = localStorage.getItem(storageKey);
              if (!raw) {
                return cloneWeeks(defaultWeeks);
              }
              var parsed = JSON.parse(raw);
              if (!Array.isArray(parsed)) {
                return cloneWeeks(defaultWeeks);
              }
              return defaultWeeks.map(function (defaultWeek) {
                var savedWeek = parsed.find(function (item) {
                  return item && item.id === defaultWeek.id;
                });
                if (!savedWeek) {
                  return cloneWeek(defaultWeek);
                }
                var startDate = sanitizeDateString(savedWeek.startDate);
                if (!startDate) {
                  startDate = deriveStartDateFromActivities(savedWeek.activities);
                }
                var activities = Array.isArray(savedWeek.activities)
                  ? savedWeek.activities
                      .map(function (activity) {
                        return sanitizeActivity(activity, startDate);
                      })
                      .filter(Boolean)
                  : [];
                return {
                  id: defaultWeek.id,
                  name: defaultWeek.name,
                  startDate: startDate,
                  activities: activities
                };
              });
            } catch (error) {
              console.warn('Impossible de charger les données sauvegardées.', error);
              return cloneWeeks(defaultWeeks);
            }
          }

          function initializeSlotOptions() {
            if (!slotSelect) {
              return;
            }
            slotSelect.innerHTML = '';
            var placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Sélectionnez une demi-journée';
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            placeholderOption.defaultSelected = true;
            slotSelect.appendChild(placeholderOption);
            halfDaySlots.forEach(function (slot) {
              var option = document.createElement('option');
              option.value = slot.id;
              option.textContent = slot.label;
              slotSelect.appendChild(option);
            });
            if (slotSelect.options.length > 0) {
              slotSelect.selectedIndex = 0;
            }
          }

          function updateSlotHelper() {
            if (!slotHelper) {
              return;
            }
            if (!slotSelect) {
              slotHelper.textContent = slotHelperDefaultText;
              return;
            }
            var selectedWeekId = weekIdInput ? weekIdInput.value : '';
            var selectedSlotId = slotSelect.value;
            if (!selectedWeekId) {
              slotHelper.textContent = slotHelperDefaultText;
              return;
            }
            var week = courseData.find(function (item) {
              return item.id === selectedWeekId;
            });
            if (!week) {
              slotHelper.textContent = slotHelperDefaultText;
              return;
            }
            var slot = halfDaySlotMap[selectedSlotId];
            if (!slot) {
              slotHelper.textContent = slotHelperDefaultText;
              return;
            }
            var computedDate = computeSlotDate(week.startDate, selectedSlotId);
            var dateText = computedDate ? formatDate(computedDate) : 'Date à définir';
            slotHelper.textContent = slot.dayLabel + ' · ' + slot.label + ' — ' + dateText;
          }

          function saveData() {
            refreshAllActivitiesDates();
            try {
              localStorage.setItem(storageKey, JSON.stringify(courseData));
            } catch (error) {
              console.warn("Impossible d'enregistrer les données.", error);
            }
          }

          function persistState() {
            saveData();
            renderBoard();
          }

          function cloneWeeks(weeks) {
            return weeks.map(function (week) {
              return cloneWeek(week);
            });
          }

          function cloneWeek(week) {
            return {
              id: week.id,
              name: week.name,
              startDate: sanitizeDateString(week.startDate),
              activities: []
            };
          }

          function sanitizeActivity(activity, weekStartDate) {
            if (!activity || typeof activity !== 'object') {
              return null;
            }
            var type = activity.type && typeLabels[activity.type] ? activity.type : 'presentation';
            var slotId = normalizeSlotId(activity.slot);
            var normalizedWeekStart = sanitizeDateString(weekStartDate);
            var sanitizedDate = '';
            if (normalizedWeekStart) {
              sanitizedDate = computeSlotDate(normalizedWeekStart, slotId);
            } else if (typeof activity.date === 'string') {
              sanitizedDate = sanitizeDateString(activity.date);
            }
            return {
              id: activity.id || generateId(),
              slot: slotId,
              type: type,
              duration: activity.duration || '',
              material: typeof activity.material === 'string' ? activity.material.trim() : '',
              description: activity.description || '',
              date: sanitizedDate
            };
          }

          function refreshAllActivitiesDates() {
            if (!Array.isArray(courseData)) {
              return;
            }
            courseData.forEach(function (week) {
              refreshWeekActivitiesDates(week);
            });
          }

          function refreshWeekActivitiesDates(week) {
            if (!week || !Array.isArray(week.activities)) {
              return;
            }
            var normalizedStart = sanitizeDateString(week.startDate);
            week.activities.forEach(function (activity) {
              if (!activity || typeof activity !== 'object') {
                return;
              }
              var normalizedSlot = normalizeSlotId(activity.slot);
              activity.slot = normalizedSlot;
              activity.date = normalizedStart
                ? computeSlotDate(normalizedStart, normalizedSlot)
                : '';
            });
          }

          function formatDate(value) {
            if (!value) {
              return 'Date à définir';
            }
            var date = new Date(value + 'T00:00:00');
            if (isNaN(date.getTime())) {
              return 'Date à définir';
            }
            return date.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }

          function formatSlotSubtitle(week, slotId) {
            var slot = halfDaySlotMap[slotId];
            if (!slot) {
              return '';
            }
            var computedDate = computeSlotDate(week.startDate, slotId);
            var dateText = computedDate ? formatDate(computedDate) : 'Date à définir';
            return slot.dayLabel + ' · ' + dateText;
          }

          function computeSlotDate(startDate, slotId) {
            var normalizedStart = sanitizeDateString(startDate);
            var slot = halfDaySlotMap[slotId];
            if (!normalizedStart || !slot) {
              return '';
            }
            var baseDate = new Date(normalizedStart + 'T00:00:00');
            if (isNaN(baseDate.getTime())) {
              return '';
            }
            baseDate.setDate(baseDate.getDate() + (slot.dayOffset || 0));
            return baseDate.toISOString().slice(0, 10);
          }

          function sanitizeDateString(value) {
            if (typeof value !== 'string') {
              return '';
            }
            var trimmed = value.trim();
            if (!trimmed) {
              return '';
            }
            var shortValue = trimmed.slice(0, 10);
            var date = new Date(shortValue + 'T00:00:00');
            if (isNaN(date.getTime())) {
              return '';
            }
            return date.toISOString().slice(0, 10);
          }

          function normalizeSlotId(slotId) {
            if (slotId && halfDaySlotMap[slotId]) {
              return slotId;
            }
            return halfDaySlots[0].id;
          }

          function countSlotActivitiesForWeek(weekId, slotId) {
            var week = courseData.find(function (item) {
              return item.id === weekId;
            });
            if (!week) {
              return 0;
            }
            return countSlotActivities(week.activities, slotId);
          }

          function countSlotActivities(activities, slotId) {
            var normalizedSlot = normalizeSlotId(slotId);
            var total = 0;
            for (var i = 0; i < activities.length; i += 1) {
              if (activities[i].slot === normalizedSlot) {
                total += 1;
              }
            }
            return total;
          }

          function getSlotIndexInActivities(activities, slotId, activityId) {
            var normalizedSlot = normalizeSlotId(slotId);
            var position = 0;
            for (var i = 0; i < activities.length; i += 1) {
              if (activities[i].slot !== normalizedSlot) {
                continue;
              }
              if (activities[i].id === activityId) {
                return position;
              }
              position += 1;
            }
            return -1;
          }

          function insertActivityInSlot(activities, activity, slotId, slotIndex) {
            var normalizedSlot = normalizeSlotId(slotId);
            activity.slot = normalizedSlot;
            if (typeof slotIndex !== 'number' || slotIndex < 0) {
              slotIndex = countSlotActivities(activities, normalizedSlot);
            }
            var currentSlotCount = 0;
            var insertionIndex = activities.length;
            for (var i = 0; i < activities.length; i += 1) {
              if (activities[i].slot !== normalizedSlot) {
                continue;
              }
              if (currentSlotCount >= slotIndex) {
                insertionIndex = i;
                break;
              }
              currentSlotCount += 1;
            }
            activities.splice(insertionIndex, 0, activity);
          }

          function deriveStartDateFromActivities(activities) {
            if (!Array.isArray(activities)) {
              return '';
            }
            var validDates = activities
              .map(function (item) {
                if (!item || typeof item.date !== 'string') {
                  return '';
                }
                return sanitizeDateString(item.date);
              })
              .filter(Boolean);
            if (validDates.length === 0) {
              return '';
            }
            validDates.sort();
            return validDates[0];
          }

          function generateId() {
            return 'act-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
          }
        })();
      </script>
    </body>
  </html>`);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
