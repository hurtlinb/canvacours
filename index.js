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

        .app-kicker {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.75rem;
          margin: 0 0 0.5rem;
          opacity: 0.85;
        }

        .app-version {
          margin-left: 0.35rem;
          font-weight: 600;
          letter-spacing: normal;
          text-transform: none;
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

        .activities {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
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

        .activity-card {
          background: linear-gradient(180deg, rgba(243, 249, 255, 0.95), rgba(226, 240, 255, 0.95));
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          box-shadow: var(--shadow-sm);
          border-left: 4px solid rgba(47, 139, 255, 0.4);
          cursor: grab;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
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
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          border-radius: 50%;
          width: 2.25rem;
          height: 2.25rem;
          font-size: 1.1rem;
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

        .activity-date {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--blue-600);
        }

        .activity-description {
          margin: 0 0 0.75rem;
          color: var(--grey-700);
          font-size: 0.95rem;
        }

        .activity-material {
          margin: 0 0 0.75rem;
          font-size: 0.85rem;
          color: var(--grey-500);
          font-weight: 600;
          word-break: break-word;
        }

        .activity-duration {
          margin: 0 0 1rem;
          font-size: 0.85rem;
          color: var(--grey-500);
          font-weight: 600;
        }

        .activity-actions {
          display: flex;
          justify-content: flex-end;
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
            <p class="app-kicker">Planification pédagogique <span class="app-version">v${version}</span></p>
            <h1>Canvas de cours</h1>
            <p class="app-subtitle">Organisez et ajustez les activités de vos 5 semaines de cours.</p>
          </div>
        </div>
      </header>
      <main class="page-content">
        <section class="board" id="weeks-board" aria-live="polite"></section>
      </main>
      <footer class="app-footer">
        <p>Version ${version}</p>
      </footer>
      <div class="modal" id="activity-modal" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <button type="button" class="modal-close" data-action="close-modal" aria-label="Fermer le formulaire">&times;</button>
          <h2 id="form-title">Ajouter une activité</h2>
          <form id="activity-form">
            <input type="hidden" name="activityId" id="activity-id" />
            <div class="form-group">
              <label for="week-select">Semaine</label>
              <select id="week-select" name="weekId" required></select>
            </div>
            <div class="form-group">
              <label for="date">Date</label>
              <input id="date" name="date" type="date" required />
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

          var board = document.getElementById('weeks-board');
          var modal = document.getElementById('activity-modal');
          var form = document.getElementById('activity-form');
          var formTitle = document.getElementById('form-title');
          var weekSelect = document.getElementById('week-select');
          var dateInput = document.getElementById('date');
          var typeSelect = document.getElementById('activity-type');
          var durationInput = document.getElementById('duration');
          var materialInput = document.getElementById('material');
          var descriptionInput = document.getElementById('description');
          var activityIdInput = document.getElementById('activity-id');
          var modalCloseButtons = modal.querySelectorAll('[data-action="close-modal"]');
          var draggedActivityId = null;
          var courseData = loadData();

          initializeWeekOptions();
          renderBoard();

          board.addEventListener('click', function (event) {
            var addTrigger = event.target.closest('[data-action="add-activity"]');
            if (addTrigger) {
              var addWeekId = addTrigger.getAttribute('data-week-id');
              openForm('create', { weekId: addWeekId });
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
              date: formData.get('date'),
              type: formData.get('activityType'),
              duration: (formData.get('duration') || '').trim(),
              material: (formData.get('material') || '').trim(),
              description: (formData.get('description') || '').trim()
            };

            if (!payload.date || !payload.description) {
              return;
            }

            if (activityId) {
              updateActivity(activityId, selectedWeekId, payload);
            } else {
              addActivity(selectedWeekId, payload);
            }

            saveData();
            renderBoard();
            closeForm();
          });

          function renderBoard() {
            while (board.firstChild) {
              board.removeChild(board.firstChild);
            }
            courseData.forEach(function (week) {
              var column = createWeekColumn(week);
              board.appendChild(column);
            });
          }

          function createWeekColumn(week) {
            var column = document.createElement('section');
            column.className = 'week-column';
            column.setAttribute('data-week-id', week.id);

            var header = document.createElement('header');
            header.className = 'week-header';

            var title = document.createElement('h2');
            title.textContent = week.name;

            var addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'btn-secondary';
            addButton.setAttribute('data-action', 'add-activity');
            addButton.setAttribute('data-week-id', week.id);
            addButton.textContent = 'Ajouter une activité';

            header.appendChild(title);
            header.appendChild(addButton);

            var list = document.createElement('div');
            list.className = 'activities';

            if (week.activities.length === 0) {
              var empty = document.createElement('p');
              empty.className = 'empty-state';
              empty.textContent = 'Aucune activité planifiée pour le moment.';
              list.appendChild(empty);
            } else {
              week.activities.forEach(function (activity) {
                list.appendChild(createActivityCard(activity, week.id));
              });
            }

            column.appendChild(header);
            column.appendChild(list);

            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('dragleave', handleDragLeave);
            column.addEventListener('drop', handleDrop);

            return column;
          }

          function createActivityCard(activity, weekId) {
            var card = document.createElement('article');
            card.className = 'activity-card';
            card.setAttribute('data-activity-id', activity.id);
            card.setAttribute('data-week-id', weekId);
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

            var dateLabel = document.createElement('span');
            dateLabel.className = 'activity-date';
            dateLabel.textContent = formatDate(activity.date);

            top.appendChild(badge);
            top.appendChild(dateLabel);

            var description = document.createElement('p');
            description.className = 'activity-description';
            description.textContent = activity.description || 'Description à préciser.';

            var material = document.createElement('p');
            material.className = 'activity-material';
            material.textContent = activity.material
              ? 'Matériel : ' + activity.material
              : 'Matériel : à préciser';

            var duration = document.createElement('p');
            duration.className = 'activity-duration';
            duration.textContent = activity.duration ? 'Temps prévu : ' + activity.duration : 'Temps prévu : à définir';

            var actions = document.createElement('div');
            actions.className = 'activity-actions';

            var editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'btn-tertiary';
            editButton.setAttribute('data-action', 'edit-activity');
            editButton.setAttribute('data-week-id', weekId);
            editButton.setAttribute('data-activity-id', activity.id);
            editButton.textContent = 'Modifier';

            actions.appendChild(editButton);

            card.appendChild(top);
            card.appendChild(description);
            card.appendChild(material);
            card.appendChild(duration);
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
          }

          function handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            var column = event.currentTarget;
            column.classList.add('is-drop-target');
          }

          function handleDragLeave(event) {
            var column = event.currentTarget;
            if (event.relatedTarget && column.contains(event.relatedTarget)) {
              return;
            }
            column.classList.remove('is-drop-target');
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
          }

          function handleCardDragLeave(event) {
            var card = event.currentTarget;
            if (event.relatedTarget && card.contains(event.relatedTarget)) {
              return;
            }
            clearCardDropState(card);
          }

          function handleCardDrop(event) {
            event.preventDefault();
            event.stopPropagation();
            var card = event.currentTarget;
            var targetWeekId = card.getAttribute('data-week-id');
            var targetActivityId = card.getAttribute('data-activity-id');
            var activityId = draggedActivityId || event.dataTransfer.getData('text/plain');
            var bounding = card.getBoundingClientRect();
            var offset = event.clientY - bounding.top;
            var isBefore = offset < bounding.height / 2;
            clearCardDropState(card);
            var relatedColumn = null;
            if (targetWeekId) {
              relatedColumn = board.querySelector('.week-column[data-week-id="' + targetWeekId + '"]');
            }
            if (relatedColumn) {
              relatedColumn.classList.remove('is-drop-target');
            }
            if (!activityId || !targetWeekId || !targetActivityId) {
              return;
            }
            var targetWeek = courseData.find(function (week) {
              return week.id === targetWeekId;
            });
            if (!targetWeek) {
              return;
            }
            var targetIndex = targetWeek.activities.findIndex(function (activity) {
              return activity.id === targetActivityId;
            });
            if (targetIndex === -1) {
              return;
            }
            if (!isBefore) {
              targetIndex += 1;
            }
            moveActivity(activityId, targetWeekId, targetIndex);
            draggedActivityId = null;
          }

          function clearCardDropState(card) {
            card.classList.remove('is-drop-target', 'is-drop-before', 'is-drop-after');
          }

          function handleDrop(event) {
            event.preventDefault();
            var column = event.currentTarget;
            column.classList.remove('is-drop-target');
            var targetWeekId = column.getAttribute('data-week-id');
            var activityId = draggedActivityId || event.dataTransfer.getData('text/plain');
            if (!activityId) {
              return;
            }
            moveActivity(activityId, targetWeekId);
            draggedActivityId = null;
          }

          function moveActivity(activityId, targetWeekId, targetIndex) {
            if (!activityId || !targetWeekId) {
              return;
            }
            var sourceWeek = findWeekByActivityId(activityId);
            if (!sourceWeek) {
              return;
            }
            var index = sourceWeek.activities.findIndex(function (item) {
              return item.id === activityId;
            });
            if (index === -1) {
              return;
            }
            var movedActivity = sourceWeek.activities.splice(index, 1)[0];
            var targetWeek = courseData.find(function (week) {
              return week.id === targetWeekId;
            });
            if (!targetWeek) {
              sourceWeek.activities.splice(index, 0, movedActivity);
              return;
            }
            if (typeof targetIndex === 'number') {
              if (targetWeek === sourceWeek && index < targetIndex) {
                targetIndex -= 1;
              }
              if (targetIndex < 0) {
                targetIndex = 0;
              }
              if (targetIndex > targetWeek.activities.length) {
                targetIndex = targetWeek.activities.length;
              }
              targetWeek.activities.splice(targetIndex, 0, movedActivity);
            } else {
              targetWeek.activities.push(movedActivity);
            }
            saveData();
            renderBoard();
          }

          function addActivity(weekId, activity) {
            var targetWeek = courseData.find(function (week) {
              return week.id === weekId;
            });
            if (!targetWeek) {
              return;
            }
            targetWeek.activities.push(activity);
          }

          function updateActivity(activityId, newWeekId, updatedData) {
            var originWeek = findWeekByActivityId(activityId);
            if (!originWeek) {
              return;
            }
            var activityIndex = originWeek.activities.findIndex(function (item) {
              return item.id === activityId;
            });
            if (activityIndex === -1) {
              return;
            }
            var updatedActivity = {
              id: updatedData.id,
              date: updatedData.date,
              type: updatedData.type,
              duration: updatedData.duration,
              material: updatedData.material,
              description: updatedData.description
            };
            if (originWeek.id === newWeekId) {
              originWeek.activities[activityIndex] = updatedActivity;
              return;
            }
            var destinationWeek = courseData.find(function (week) {
              return week.id === newWeekId;
            });
            if (!destinationWeek) {
              originWeek.activities[activityIndex] = updatedActivity;
              return;
            }
            originWeek.activities.splice(activityIndex, 1);
            destinationWeek.activities.push(updatedActivity);
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
            if (mode === 'edit' && options.activity) {
              formTitle.textContent = 'Modifier une activité';
              activityIdInput.value = options.activity.id;
              setSelectValue(weekSelect, options.weekId || options.activity.weekId);
              dateInput.value = options.activity.date || '';
              typeSelect.value = options.activity.type && typeLabels[options.activity.type] ? options.activity.type : 'presentation';
              durationInput.value = options.activity.duration || '';
              materialInput.value = options.activity.material || '';
              descriptionInput.value = options.activity.description || '';
            } else {
              formTitle.textContent = 'Ajouter une activité';
              activityIdInput.value = '';
              setSelectValue(weekSelect, options.weekId);
              typeSelect.value = 'presentation';
              materialInput.value = '';
            }
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            window.setTimeout(function () {
              dateInput.focus();
            }, 100);
          }

          function closeForm() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            form.reset();
            activityIdInput.value = '';
          }

          function setSelectValue(select, value) {
            var found = false;
            if (typeof value === 'string') {
              for (var i = 0; i < select.options.length; i += 1) {
                if (select.options[i].value === value) {
                  select.selectedIndex = i;
                  found = true;
                  break;
                }
              }
            }
            if (!found && select.options.length > 0) {
              select.selectedIndex = 0;
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
                var activities = Array.isArray(savedWeek.activities)
                  ? savedWeek.activities.map(sanitizeActivity).filter(Boolean)
                  : [];
                return {
                  id: defaultWeek.id,
                  name: defaultWeek.name,
                  activities: activities
                };
              });
            } catch (error) {
              console.warn('Impossible de charger les données sauvegardées.', error);
              return cloneWeeks(defaultWeeks);
            }
          }

          function initializeWeekOptions() {
            weekSelect.innerHTML = '';
            courseData.forEach(function (week) {
              var option = document.createElement('option');
              option.value = week.id;
              option.textContent = week.name;
              weekSelect.appendChild(option);
            });
            if (weekSelect.options.length > 0) {
              weekSelect.selectedIndex = 0;
            }
          }

          function saveData() {
            try {
              localStorage.setItem(storageKey, JSON.stringify(courseData));
            } catch (error) {
              console.warn("Impossible d'enregistrer les données.", error);
            }
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
              activities: []
            };
          }

          function sanitizeActivity(activity) {
            if (!activity || typeof activity !== 'object') {
              return null;
            }
            var type = activity.type && typeLabels[activity.type] ? activity.type : 'presentation';
            return {
              id: activity.id || generateId(),
              date: activity.date || '',
              type: type,
              duration: activity.duration || '',
              material: typeof activity.material === 'string' ? activity.material.trim() : '',
              description: activity.description || ''
            };
          }

          function formatDate(value) {
            if (!value) {
              return 'Date à confirmer';
            }
            var date = new Date(value + 'T00:00:00');
            if (isNaN(date.getTime())) {
              return value;
            }
            return date.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
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
