(function () {
  'use strict';

  var storageKey = 'course-canvas-v2';
  var legacyStorageKey = 'course-canvas-v1';
  var defaultWeeks = Array.from({ length: 5 }, function (_, index) {
    return {
      id: 'week-' + (index + 1),
      name: 'Semaine ' + (index + 1),
      startDate: '',
      startHalfDay: 'am',
      activities: []
    };
  });

  var typeLabels = {
    presentation: 'Présentation',
    groupe: 'Travail de groupe',
    demonstration: 'Démonstration',
    'exercice-individuel': 'Exercice individuel',
    recherche: "Recherche d'information",
    jeu: 'Jeu/Tournoi/Challenge',
    synthese: 'Synthèse',
    evaluation: 'Évaluation'
  };

  var typeIcons = {
    presentation: '🎤',
    groupe: '🤝',
    demonstration: '🧑‍🏫',
    'exercice-individuel': '✍️',
    recherche: '🔍',
    jeu: '🏆',
    synthese: '🧠',
    evaluation: '📊'
  };

  var typeAliases = {
    exercice: 'exercice-individuel'
  };

  var halfDayChoiceLabels = {
    am: 'Matin',
    pm: 'Après-midi'
  };

  var weekStartSlotByHalfDay = {
    am: 'monday-am',
    pm: 'monday-pm'
  };

  function normalizeActivityType(value) {
    if (typeof value !== 'string') {
      return 'presentation';
    }
    var key = value.trim().toLowerCase();
    if (!key) {
      return 'presentation';
    }
    if (typeAliases[key]) {
      key = typeAliases[key];
    }
    return typeLabels[key] ? key : 'presentation';
  }

  var HALF_DAY_SLOTS_PER_WEEK = 3;

  var halfDaySlots = [
    {
      id: 'monday-am',
      label: 'Lundi matin',
      timeLabel: 'matin',
      dayOffset: 0
    },
    {
      id: 'monday-pm',
      label: 'Lundi après-midi',
      timeLabel: 'après-midi',
      dayOffset: 0
    },
    {
      id: 'tuesday-am',
      label: 'Mardi matin',
      timeLabel: 'matin',
      dayOffset: 1
    },
    {
      id: 'tuesday-pm',
      label: 'Mardi après-midi',
      timeLabel: 'après-midi',
      dayOffset: 1
    }
  ];

  var defaultSlotId = halfDaySlots.length > 0 ? halfDaySlots[0].id : '';

  var halfDaySlotMap = {};
  var halfDaySlotIndexMap = {};
  halfDaySlots.forEach(function (slot, index) {
    halfDaySlotMap[slot.id] = slot;
    halfDaySlotIndexMap[slot.id] = index;
  });

  var legacySlotIdMap = {
    'wednesday-am': 'monday-pm',
    'friday-am': 'tuesday-am'
  };

  var slotHelperDefaultText =
    "Les activités restent toujours dans la même demie-journée, c'est uniquement son nom qui change.";

  var board = document.getElementById('weeks-board');
  var modal = document.getElementById('activity-modal');
  var form = document.getElementById('activity-form');
  var formTitle = document.getElementById('form-title');
  var weekIdInput = document.getElementById('week-id');
  var slotInput = document.getElementById('slot');
  var weekSelect = document.getElementById('week-select');
  var slotRadioGroup = document.getElementById('slot-radio-group');
  var slotRadioInputs = [];
  var slotHelper = document.getElementById('slot-helper');
  if (slotHelper) {
    if (slotHelper.textContent && slotHelper.textContent.trim()) {
      slotHelperDefaultText = slotHelper.textContent.trim();
    } else {
      slotHelper.textContent = slotHelperDefaultText;
    }
  }
  initializeSlotRadios();
  var typeSelect = document.getElementById('activity-type');
  var durationInput = document.getElementById('duration');
  var materialInput = document.getElementById('material');
  var descriptionInput = document.getElementById('description');
  var activityIdInput = document.getElementById('activity-id');
  var modalCloseButtons = modal.querySelectorAll('[data-action="close-modal"]');
  var courseSelector = document.getElementById('course-selector');
  var newCourseButton = document.getElementById('new-course-button');
  var renameCourseButton = document.getElementById('rename-course-button');
  var deleteCourseButton = document.getElementById('delete-course-button');
  var draggedActivityId = null;
  var coursesState = loadCoursesState();
  var courseData = getActiveCourseWeeks();

  updateCourseSelector();
  renderBoard();

  if (courseSelector) {
    courseSelector.addEventListener('change', function (event) {
      setActiveCourse(event.target.value);
    });
  }

  if (newCourseButton) {
    newCourseButton.addEventListener('click', function () {
      createNewCourse();
    });
  }

  if (renameCourseButton) {
    renameCourseButton.addEventListener('click', function () {
      renameActiveCourse();
    });
  }

  if (deleteCourseButton) {
    deleteCourseButton.addEventListener('click', function () {
      deleteActiveCourse();
    });
  }

  if (weekSelect) {
    weekSelect.addEventListener('change', function (event) {
      if (weekIdInput) {
        weekIdInput.value = typeof event.target.value === 'string' ? event.target.value : '';
      }
      updateSlotRadiosAvailability();
      updateSlotHelper();
    });
  }

  board.addEventListener('click', function (event) {
    var addTrigger = event.target.closest('[data-action="add-activity"]');
    if (addTrigger) {
      var addWeekId = addTrigger.getAttribute('data-week-id');
      var addSlotId = addTrigger.getAttribute('data-slot-id');
      openForm('create', { weekId: addWeekId, slotId: addSlotId });
      return;
    }

    var deleteTrigger = event.target.closest('[data-action="delete-activity"]');
    if (deleteTrigger) {
      var deleteWeekId = deleteTrigger.getAttribute('data-week-id');
      var deleteActivityId = deleteTrigger.getAttribute('data-activity-id');
      deleteActivity(deleteActivityId, deleteWeekId);
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
    var desiredWeekId = '';
    if (weekIdInput && weekIdInput.value) {
      desiredWeekId = weekIdInput.value;
    } else if (weekSelect && weekSelect.value) {
      desiredWeekId = weekSelect.value;
    }
    applyWeekSelection(desiredWeekId);
    updateSlotRadiosAvailability();
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

    var scheduleRow = document.createElement('div');
    scheduleRow.className = 'week-schedule-row';

    var datePicker = document.createElement('label');
    datePicker.className = 'week-date-picker';

    var dateLabel = document.createElement('span');
    dateLabel.textContent = 'Début du cours';

    var dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = week.startDate || '';
    dateInput.addEventListener('change', function (event) {
      var normalized = normalizeWeekStartDate(event.target.value);
      week.startDate = normalized;
      event.target.value = normalized;
      refreshWeekActivitiesDates(week);
      propagateFollowingWeekStartDates(week);
      saveData();
      renderBoard();
      updateSlotHelper();
    });

    datePicker.appendChild(dateLabel);
    datePicker.appendChild(dateInput);
    scheduleRow.appendChild(datePicker);

    var startHalfDay = normalizeHalfDay(week.startHalfDay);
    week.startHalfDay = startHalfDay;

    var halfDayToggle = document.createElement('div');
    halfDayToggle.className = 'week-halfday-toggle';

    var halfDayOptions = document.createElement('div');
    halfDayOptions.className = 'week-halfday-toggle-options';
    halfDayOptions.setAttribute('role', 'radiogroup');
    halfDayOptions.setAttribute('aria-label', 'Demi-journée de démarrage');

    ['am', 'pm'].forEach(function (halfDayValue) {
      var optionLabel = document.createElement('label');
      optionLabel.className = 'week-halfday-toggle-option';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'start-halfday-' + week.id;
      input.value = halfDayValue;
      input.checked = startHalfDay === halfDayValue;
      var optionText = halfDayChoiceLabels[halfDayValue] || halfDayChoiceLabels.am;
      input.setAttribute('aria-label', optionText);
      input.addEventListener('change', function (event) {
        if (!event.target.checked) {
          return;
        }
        var selectedValue = normalizeHalfDay(event.target.value);
        if (selectedValue === week.startHalfDay) {
          return;
        }
        var previousOrder = getActivitySlotOrderIndices(week.activities);
        week.startHalfDay = selectedValue;
        remapWeekActivitiesForHalfDay(week, previousOrder);
        saveData();
        renderBoard();
        updateSlotHelper();
      });

      var text = document.createElement('span');
      text.textContent = optionText;

      if (input.checked) {
        optionLabel.classList.add('is-active');
      }

      optionLabel.appendChild(input);
      optionLabel.appendChild(text);
      halfDayOptions.appendChild(optionLabel);
    });

    halfDayToggle.appendChild(halfDayOptions);
    scheduleRow.appendChild(halfDayToggle);

    titleRow.appendChild(scheduleRow);
    header.appendChild(titleRow);

    var slotsWrapper = document.createElement('div');
    slotsWrapper.className = 'week-slots';

    var orderedSlots = getOrderedHalfDaySlotsForWeek(week);
    orderedSlots.forEach(function (slot) {
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
      var slotTitleText = formatSlotDayLabel(week.startDate, slot);
      var slotDateText = formatSlotDateLabel(week.startDate, slot);
      var slotDisplayText = slotTitleText || slot.label;
      if (slotDateText) {
        slotDisplayText += ' – ' + slotDateText;
      }
      slotTitle.textContent = slotDisplayText;

      slotInfo.appendChild(slotTitle);

      var slotAddButton = document.createElement('button');
      slotAddButton.type = 'button';
      slotAddButton.className = 'btn-tertiary btn-slot-add';
      slotAddButton.setAttribute('data-action', 'add-activity');
      slotAddButton.setAttribute('data-week-id', week.id);
      slotAddButton.setAttribute('data-slot-id', slot.id);
      slotAddButton.setAttribute('aria-label', 'Ajouter une activité');
      slotAddButton.textContent = '+';

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
    var typeKey = normalizeActivityType(activity.type);
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
    editButton.className = 'btn-tertiary btn-icon';
    editButton.setAttribute('data-action', 'edit-activity');
    editButton.setAttribute('data-week-id', week.id);
    editButton.setAttribute('data-activity-id', activity.id);
    editButton.setAttribute('aria-label', "Modifier l'activité");
    editButton.title = "Modifier l'activité";
    editButton.textContent = '✏️';

    actions.appendChild(editButton);

    var deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-tertiary btn-icon';
    deleteButton.setAttribute('data-action', 'delete-activity');
    deleteButton.setAttribute('data-week-id', week.id);
    deleteButton.setAttribute('data-activity-id', activity.id);
    deleteButton.setAttribute('aria-label', "Supprimer l'activité");
    deleteButton.title = "Supprimer l'activité";
    deleteButton.textContent = '🗑️';

    actions.appendChild(deleteButton);

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

  function deleteActivity(activityId, weekId) {
    if (!activityId) {
      return false;
    }
    var targetWeek = null;
    if (typeof weekId === 'string' && weekId) {
      targetWeek = courseData.find(function (week) {
        return week.id === weekId;
      });
    }
    if (!targetWeek) {
      targetWeek = findWeekByActivityId(activityId);
    }
    if (!targetWeek) {
      return false;
    }
    var activityIndex = targetWeek.activities.findIndex(function (item) {
      return item.id === activityId;
    });
    if (activityIndex === -1) {
      return false;
    }
    targetWeek.activities.splice(activityIndex, 1);
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
    var appliedWeekId = applyWeekSelection(targetWeekId);
    if (weekIdInput) {
      weekIdInput.value = appliedWeekId;
    }
    updateSlotRadiosAvailability();
    if (mode === 'edit' && options.activity) {
      formTitle.textContent = 'Modifier une activité';
      activityIdInput.value = options.activity.id;
      setSlotValue(options.activity.slot);
      typeSelect.value = normalizeActivityType(options.activity.type);
      durationInput.value = options.activity.duration || '';
      materialInput.value = options.activity.material || '';
      descriptionInput.value = options.activity.description || '';
    } else {
      formTitle.textContent = 'Ajouter une activité';
      activityIdInput.value = '';
      if (typeof options.slotId === 'string' && options.slotId) {
        setSlotValue(options.slotId);
      } else {
        clearSlotValue();
      }
      typeSelect.value = 'presentation';
      materialInput.value = '';
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(function () {
      if (typeSelect) {
        typeSelect.focus();
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
    clearSlotValue();
  }

  function clearSlotValue() {
    clearSlotRadios();
    if (!slotInput) {
      if (slotHelper) {
        slotHelper.textContent = slotHelperDefaultText;
      }
      return;
    }
    slotInput.value = '';
    updateSlotHelper();
  }

  function setSlotValue(value) {
    if (!slotInput) {
      return;
    }
    if (typeof value === 'string') {
      var trimmed = value.trim();
      if (trimmed && halfDaySlotMap[trimmed]) {
        slotInput.value = trimmed;
        updateSlotRadios(trimmed);
        updateSlotHelper();
        return;
      }
      if (trimmed) {
        var normalized = normalizeSlotId(trimmed);
        slotInput.value = normalized;
        updateSlotRadios(normalized);
        updateSlotHelper();
        return;
      }
    }
    clearSlotValue();
  }

  function updateCourseSelector() {
    if (!courseSelector) {
      return;
    }
    while (courseSelector.firstChild) {
      courseSelector.removeChild(courseSelector.firstChild);
    }
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      return;
    }
    var activeCourse = getActiveCourse();
    var activeId = activeCourse ? activeCourse.id : '';
    coursesState.courses.forEach(function (course) {
      if (!course || typeof course !== 'object') {
        return;
      }
      var option = document.createElement('option');
      option.value = course.id;
      option.textContent = course.name || 'Cours';
      courseSelector.appendChild(option);
    });
    if (activeId) {
      courseSelector.value = activeId;
    }
  }

  function getActiveCourse() {
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      coursesState = createInitialCoursesState();
    }
    if (coursesState.courses.length === 0) {
      var fallbackCourse = createCourseFromWeeks(generateDefaultCourseName(1), []);
      coursesState.courses.push(fallbackCourse);
      coursesState.activeCourseId = fallbackCourse.id;
    }
    var activeCourse = coursesState.courses.find(function (course) {
      return course && course.id === coursesState.activeCourseId;
    });
    if (!activeCourse) {
      activeCourse = coursesState.courses[0];
      coursesState.activeCourseId = activeCourse.id;
    }
    if (!Array.isArray(activeCourse.weeks)) {
      activeCourse.weeks = cloneWeeks(defaultWeeks);
    }
    return activeCourse;
  }

  function getActiveCourseWeeks() {
    return getActiveCourse().weeks;
  }

  function setActiveCourse(courseId) {
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      return;
    }
    var targetCourse = coursesState.courses.find(function (course) {
      return course && course.id === courseId;
    });
    if (!targetCourse) {
      return;
    }
    if (targetCourse.id === coursesState.activeCourseId) {
      courseData = targetCourse.weeks;
      renderBoard();
      updateSlotHelper();
      updateCourseSelector();
      return;
    }
    coursesState.activeCourseId = targetCourse.id;
    courseData = targetCourse.weeks;
    if (modal && modal.classList.contains('is-open')) {
      closeForm();
    } else {
      if (weekIdInput) {
        weekIdInput.value = '';
      }
      clearSlotValue();
    }
    saveData();
    renderBoard();
    updateSlotHelper();
    updateCourseSelector();
  }

  function createNewCourse() {
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      coursesState = createInitialCoursesState();
    }
    var courseName = generateAvailableCourseName();
    var newCourse = {
      id: generateCourseId(),
      name: courseName,
      weeks: cloneWeeks(defaultWeeks)
    };
    coursesState.courses.push(newCourse);
    setActiveCourse(newCourse.id);
  }

  function deleteActiveCourse() {
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      return false;
    }
    if (coursesState.courses.length === 0) {
      return false;
    }
    var activeCourse = getActiveCourse();
    if (!activeCourse) {
      return false;
    }
    var confirmed = window.confirm(
      'Voulez-vous supprimer ce cours ? Toutes les activités associées seront définitivement perdues.'
    );
    if (!confirmed) {
      return false;
    }
    var courseIndex = coursesState.courses.findIndex(function (course) {
      return course && course.id === activeCourse.id;
    });
    if (courseIndex === -1) {
      return false;
    }
    coursesState.courses.splice(courseIndex, 1);
    var nextCourseId = null;
    if (coursesState.courses.length === 0) {
      var resetState = createInitialCoursesState();
      nextCourseId = resetState.activeCourseId;
      coursesState = resetState;
      coursesState.activeCourseId = '';
    } else {
      var nextIndex = courseIndex;
      if (nextIndex >= coursesState.courses.length) {
        nextIndex = coursesState.courses.length - 1;
      }
      var nextCourse = coursesState.courses[nextIndex];
      nextCourseId = nextCourse ? nextCourse.id : null;
    }
    if (typeof nextCourseId === 'string' && nextCourseId) {
      setActiveCourse(nextCourseId);
    } else {
      courseData = getActiveCourseWeeks();
      saveData();
      renderBoard();
      updateSlotHelper();
      updateCourseSelector();
    }
    if (courseSelector) {
      courseSelector.focus();
    }
    return true;
  }

  function renameActiveCourse() {
    if (!coursesState || !Array.isArray(coursesState.courses)) {
      return;
    }
    var activeCourse = getActiveCourse();
    if (!activeCourse) {
      return;
    }
    var currentName =
      typeof activeCourse.name === 'string' && activeCourse.name.trim()
        ? activeCourse.name.trim()
        : generateDefaultCourseName(1);
    var proposedName = window.prompt('Nom du cours', currentName);
    if (typeof proposedName !== 'string') {
      return;
    }
    var trimmed = proposedName.trim();
    if (!trimmed) {
      return;
    }
    var normalized = trimmed.toLowerCase();
    var duplicate = coursesState.courses.some(function (course) {
      if (!course || course.id === activeCourse.id) {
        return false;
      }
      if (typeof course.name !== 'string') {
        return false;
      }
      return course.name.trim().toLowerCase() === normalized;
    });
    if (duplicate) {
      window.alert('Un cours avec ce nom existe déjà.');
      return;
    }
    activeCourse.name = trimmed;
    saveData();
    updateCourseSelector();
    if (courseSelector) {
      courseSelector.value = activeCourse.id;
      courseSelector.focus();
    }
  }

  function loadCoursesState() {
    try {
      var raw = localStorage.getItem(storageKey);
      var parsed = safeParse(raw);
      var normalized = normalizeCoursesState(parsed);
      if (normalized) {
        return normalized;
      }
      var legacyRaw = typeof legacyStorageKey === 'string' ? localStorage.getItem(legacyStorageKey) : null;
      var legacyParsed = safeParse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        var migratedCourse = createCourseFromWeeks(generateDefaultCourseName(1), legacyParsed);
        return {
          activeCourseId: migratedCourse.id,
          courses: [migratedCourse]
        };
      }
    } catch (error) {
      console.warn('Impossible de charger les données sauvegardées.', error);
    }
    return createInitialCoursesState();
  }

  function createInitialCoursesState() {
    var initialCourse = {
      id: generateCourseId(),
      name: generateDefaultCourseName(1),
      weeks: cloneWeeks(defaultWeeks)
    };
    return {
      activeCourseId: initialCourse.id,
      courses: [initialCourse]
    };
  }

  function createCourseFromWeeks(name, weeks) {
    var courseName = typeof name === 'string' && name.trim() ? name.trim() : generateDefaultCourseName(1);
    return {
      id: generateCourseId(),
      name: courseName,
      weeks: mergeWeeks(weeks)
    };
  }

  function normalizeCoursesState(rawState) {
    if (!rawState) {
      return null;
    }
    if (Array.isArray(rawState)) {
      return normalizeCoursesState({ courses: rawState });
    }
    if (typeof rawState !== 'object') {
      return null;
    }
    var usedIds = {};
    var rawCourses = Array.isArray(rawState.courses) ? rawState.courses.slice() : [];
    if (rawCourses.length === 0 && Array.isArray(rawState.weeks)) {
      rawCourses.push({ weeks: rawState.weeks, name: rawState.name });
    }
    var normalizedCourses = rawCourses
      .map(function (course, index) {
        return normalizeCourse(course, index + 1, usedIds);
      })
      .filter(Boolean);
    if (normalizedCourses.length === 0) {
      return null;
    }
    var activeCourseId =
      typeof rawState.activeCourseId === 'string' && usedIds[rawState.activeCourseId]
        ? rawState.activeCourseId
        : normalizedCourses[0].id;
    return {
      activeCourseId: activeCourseId,
      courses: normalizedCourses
    };
  }

  function normalizeCourse(rawCourse, index, usedIds) {
    if (!rawCourse || typeof rawCourse !== 'object') {
      return null;
    }
    var identifier =
      typeof rawCourse.id === 'string' && rawCourse.id.trim() ? rawCourse.id.trim() : generateCourseId();
    while (usedIds[identifier]) {
      identifier = generateCourseId();
    }
    usedIds[identifier] = true;
    var courseName =
      typeof rawCourse.name === 'string' && rawCourse.name.trim()
        ? rawCourse.name.trim()
        : generateDefaultCourseName(index);
    var weeksSource = [];
    if (Array.isArray(rawCourse.weeks)) {
      weeksSource = rawCourse.weeks;
    } else if (Array.isArray(rawCourse.data)) {
      weeksSource = rawCourse.data;
    } else if (Array.isArray(rawCourse.courseData)) {
      weeksSource = rawCourse.courseData;
    }
    return {
      id: identifier,
      name: courseName,
      weeks: mergeWeeks(weeksSource)
    };
  }

  function mergeWeeks(savedWeeks) {
    var source = Array.isArray(savedWeeks) ? savedWeeks : [];
    return defaultWeeks.map(function (defaultWeek) {
      var savedWeek = source.find(function (item) {
        return item && item.id === defaultWeek.id;
      });
      if (!savedWeek) {
        return cloneWeek(defaultWeek);
      }
      var startDate = normalizeWeekStartDate(savedWeek.startDate);
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
      var weekName =
        typeof savedWeek.name === 'string' && savedWeek.name.trim() ? savedWeek.name.trim() : defaultWeek.name;
      var startHalfDay = normalizeHalfDay(savedWeek.startHalfDay);
      var mergedWeek = {
        id: defaultWeek.id,
        name: weekName,
        startDate: startDate,
        startHalfDay: startHalfDay,
        activities: activities
      };
      synchronizeWeekActivitiesWithStartHalfDay(mergedWeek);
      return mergedWeek;
    });
  }

  function generateDefaultCourseName(index) {
    var number = typeof index === 'number' && index > 0 ? Math.floor(index) : 1;
    return 'Cours ' + number;
  }

  function generateAvailableCourseName() {
    var usedNames = {};
    if (coursesState && Array.isArray(coursesState.courses)) {
      coursesState.courses.forEach(function (course) {
        if (course && typeof course.name === 'string') {
          usedNames[course.name.trim().toLowerCase()] = true;
        }
      });
    }
    var counter =
      coursesState && Array.isArray(coursesState.courses) ? coursesState.courses.length + 1 : 1;
    var candidate = generateDefaultCourseName(counter);
    while (usedNames[candidate.toLowerCase()]) {
      counter += 1;
      candidate = generateDefaultCourseName(counter);
    }
    return candidate;
  }

  function safeParse(value) {
    if (typeof value !== 'string' || !value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Impossible de décoder les données sauvegardées.', error);
      return null;
    }
  }

  function updateSlotHelper() {
    if (!slotHelper) {
      return;
    }
    if (!slotInput) {
      slotHelper.textContent = slotHelperDefaultText;
      return;
    }
    var selectedWeekId = weekIdInput ? weekIdInput.value : '';
    var selectedSlotId = slotInput.value;
    if (!selectedSlotId) {
      slotHelper.textContent = slotHelperDefaultText;
      return;
    }
    var slot = halfDaySlotMap[selectedSlotId];
    if (!slot) {
      slotHelper.textContent = slotHelperDefaultText;
      return;
    }
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
    var dayLabel = formatSlotDayLabel(week.startDate, slot);
    if (dayLabel) {
      slotHelper.textContent = dayLabel;
      return;
    }
    if (slot.label) {
      slotHelper.textContent = slot.label;
      return;
    }
    slotHelper.textContent = slotHelperDefaultText;
  }

  function initializeSlotRadios() {
    slotRadioInputs = [];
    if (!slotRadioGroup) {
      return;
    }
    while (slotRadioGroup.firstChild) {
      slotRadioGroup.removeChild(slotRadioGroup.firstChild);
    }
    halfDaySlots.forEach(function (slot) {
      var label = document.createElement('label');
      label.className = 'slot-radio-option';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'slot-choice';
      input.value = slot.id;
      input.id = 'slot-radio-' + slot.id;
      input.addEventListener('change', handleSlotRadioChange);
      var text = document.createElement('span');
      text.textContent = slot.label;
      label.appendChild(input);
      label.appendChild(text);
      slotRadioGroup.appendChild(label);
      slotRadioInputs.push(input);
    });
    updateSlotRadios(slotInput ? slotInput.value : '');
    updateSlotRadiosAvailability();
  }

  function handleSlotRadioChange(event) {
    var target = event && event.target ? event.target : null;
    if (!target || !target.checked) {
      return;
    }
    setSlotValue(target.value);
  }

  function updateSlotRadios(selectedSlotId) {
    if (!slotRadioInputs || slotRadioInputs.length === 0) {
      return;
    }
    if (typeof selectedSlotId !== 'string' || !selectedSlotId) {
      clearSlotRadios();
      return;
    }
    var normalized = halfDaySlotMap[selectedSlotId]
      ? selectedSlotId
      : normalizeSlotId(selectedSlotId);
    slotRadioInputs.forEach(function (input) {
      input.checked = input.value === normalized;
    });
  }

  function updateSlotRadiosAvailability() {
    if (!slotRadioInputs || slotRadioInputs.length === 0) {
      return;
    }
    var selectedWeekId = '';
    if (weekIdInput && typeof weekIdInput.value === 'string' && weekIdInput.value) {
      selectedWeekId = weekIdInput.value;
    } else if (weekSelect && typeof weekSelect.value === 'string' && weekSelect.value) {
      selectedWeekId = weekSelect.value;
    }
    var allowedIds = [];
    if (selectedWeekId && Array.isArray(courseData)) {
      var matchingWeek = courseData.find(function (item) {
        return item && item.id === selectedWeekId;
      });
      if (matchingWeek) {
        allowedIds = getOrderedHalfDaySlotsForWeek(matchingWeek).map(function (slot) {
          return slot.id;
        });
      }
    }
    if (allowedIds.length === 0) {
      allowedIds = halfDaySlots.slice(0, HALF_DAY_SLOTS_PER_WEEK).map(function (slot) {
        return slot.id;
      });
    }
    var allowedSet = {};
    allowedIds.forEach(function (id) {
      allowedSet[id] = true;
    });
    slotRadioInputs.forEach(function (input) {
      var isAllowed = !!allowedSet[input.value];
      input.disabled = !isAllowed;
      if (!isAllowed) {
        input.checked = false;
      }
      var label = input.parentElement;
      if (label) {
        label.hidden = !isAllowed;
      }
    });
    if (!slotInput) {
      return;
    }
    var currentValue = typeof slotInput.value === 'string' ? slotInput.value : '';
    if (currentValue && allowedSet[currentValue]) {
      return;
    }
    if (allowedIds.length > 0) {
      slotInput.value = allowedIds[0];
      updateSlotRadios(allowedIds[0]);
      updateSlotHelper();
      return;
    }
    clearSlotValue();
  }

  function clearSlotRadios() {
    if (!slotRadioInputs || slotRadioInputs.length === 0) {
      return;
    }
    slotRadioInputs.forEach(function (input) {
      input.checked = false;
    });
  }

  function applyWeekSelection(desiredWeekId) {
    var targetId = '';
    if (!Array.isArray(courseData)) {
      courseData = [];
    }
    if (!weekSelect) {
      targetId = typeof desiredWeekId === 'string' ? desiredWeekId : '';
      if (weekIdInput) {
        weekIdInput.value = targetId;
      }
      return targetId;
    }
    while (weekSelect.firstChild) {
      weekSelect.removeChild(weekSelect.firstChild);
    }
    var fallbackId = '';
    courseData.forEach(function (week, index) {
      if (!week || typeof week !== 'object') {
        return;
      }
      var option = document.createElement('option');
      option.value = week.id;
      option.textContent =
        typeof week.name === 'string' && week.name.trim()
          ? week.name.trim()
          : 'Semaine ' + (index + 1);
      weekSelect.appendChild(option);
      if (!fallbackId) {
        fallbackId = week.id;
      }
      if (
        typeof desiredWeekId === 'string' &&
        desiredWeekId &&
        week.id === desiredWeekId
      ) {
        targetId = desiredWeekId;
      }
    });
    if (!targetId) {
      targetId =
        typeof desiredWeekId === 'string' && desiredWeekId ? desiredWeekId : '';
    }
    if (!targetId) {
      targetId = fallbackId;
    }
    if (targetId) {
      weekSelect.value = targetId;
    } else if (weekSelect.options.length > 0) {
      weekSelect.selectedIndex = 0;
      targetId = weekSelect.value;
    }
    if (weekIdInput) {
      weekIdInput.value = targetId;
    }
    return targetId;
  }

  function saveData() {
    refreshAllActivitiesDates();
    getActiveCourse();
    try {
      localStorage.setItem(storageKey, JSON.stringify(coursesState));
      if (legacyStorageKey && legacyStorageKey !== storageKey) {
        localStorage.removeItem(legacyStorageKey);
      }
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
      startDate: normalizeWeekStartDate(week.startDate),
      startHalfDay: normalizeHalfDay(week.startHalfDay),
      activities: []
    };
  }

  function sanitizeActivity(activity, weekStartDate) {
    if (!activity || typeof activity !== 'object') {
      return null;
    }
    var type = normalizeActivityType(activity.type);
    var slotId = normalizeSlotId(activity.slot);
    var normalizedWeekStart = normalizeWeekStartDate(weekStartDate);
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

  function propagateFollowingWeekStartDates(changedWeek) {
    if (!changedWeek || !Array.isArray(courseData)) {
      return;
    }
    var startIndex = courseData.findIndex(function (week) {
      if (!week || typeof week !== 'object') {
        return false;
      }
      if (week === changedWeek) {
        return true;
      }
      if (changedWeek && week.id && changedWeek.id) {
        return week.id === changedWeek.id;
      }
      return false;
    });
    if (startIndex === -1) {
      return;
    }
    var previousStart = normalizeWeekStartDate(courseData[startIndex].startDate);
    for (var index = startIndex + 1; index < courseData.length; index += 1) {
      var targetWeek = courseData[index];
      if (!targetWeek || typeof targetWeek !== 'object') {
        continue;
      }
      if (previousStart) {
        var previousDate = new Date(previousStart + 'T00:00:00');
        if (isNaN(previousDate.getTime())) {
          targetWeek.startDate = '';
          previousStart = '';
        } else {
          previousDate.setDate(previousDate.getDate() + 7);
          var formatted = formatDateForInput(previousDate);
          targetWeek.startDate = formatted;
          previousStart = formatted;
        }
      } else {
        targetWeek.startDate = '';
        previousStart = '';
      }
      refreshWeekActivitiesDates(targetWeek);
    }
  }

  function refreshWeekActivitiesDates(week) {
    if (!week || !Array.isArray(week.activities)) {
      return;
    }
    var normalizedStart = normalizeWeekStartDate(week.startDate);
    week.startDate = normalizedStart;
    week.startHalfDay = normalizeHalfDay(week.startHalfDay);
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

  function formatSlotDayLabel(weekStartDate, slot) {
    if (!slot) {
      return '';
    }
    var slotDate = computeSlotDate(weekStartDate, slot.id);
    if (!slotDate) {
      return slot.label;
    }
    var parsedDate = new Date(slotDate + 'T00:00:00');
    if (isNaN(parsedDate.getTime())) {
      return slot.label;
    }
    var dayName = parsedDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    if (!dayName) {
      return slot.label;
    }
    var formattedDay = capitalizeFirstLetter(dayName);
    if (slot.timeLabel) {
      return formattedDay + ' ' + slot.timeLabel;
    }
    return formattedDay;
  }

  function formatSlotDateLabel(weekStartDate, slot) {
    if (!slot) {
      return '';
    }
    var slotDate = computeSlotDate(weekStartDate, slot.id);
    if (!slotDate) {
      return '';
    }
    var parsedDate = new Date(slotDate + 'T00:00:00');
    if (isNaN(parsedDate.getTime())) {
      return '';
    }
    return parsedDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function capitalizeFirstLetter(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatDateForInput(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1);
    if (month.length < 2) {
      month = '0' + month;
    }
    var day = String(date.getDate());
    if (day.length < 2) {
      day = '0' + day;
    }
    return year + '-' + month + '-' + day;
  }

  function computeSlotDate(startDate, slotId) {
    var normalizedStart = normalizeWeekStartDate(startDate);
    var slot = halfDaySlotMap[slotId];
    if (!normalizedStart || !slot) {
      return '';
    }
    var baseDate = new Date(normalizedStart + 'T00:00:00');
    if (isNaN(baseDate.getTime())) {
      return '';
    }
    baseDate.setDate(baseDate.getDate() + (slot.dayOffset || 0));
    return formatDateForInput(baseDate);
  }

  function sanitizeDateString(value) {
    if (typeof value !== 'string') {
      return '';
    }
    var trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    var match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match) {
      return '';
    }
    var candidate = match[1];
    var date = new Date(candidate + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return '';
    }
    return formatDateForInput(date);
  }

  function normalizeWeekStartDate(value) {
    return sanitizeDateString(value);
  }

  function normalizeHalfDay(value) {
    return value === 'pm' ? 'pm' : 'am';
  }

  function normalizeSlotId(slotId) {
    if (slotId && halfDaySlotMap[slotId]) {
      return slotId;
    }
    if (slotId && legacySlotIdMap[slotId]) {
      return legacySlotIdMap[slotId];
    }
    return defaultSlotId;
  }

  function getWeekStartSlotId(week) {
    var normalizedHalfDay = normalizeHalfDay(week && week.startHalfDay);
    var candidate = weekStartSlotByHalfDay[normalizedHalfDay];
    if (candidate && halfDaySlotMap[candidate]) {
      return candidate;
    }
    return defaultSlotId;
  }

  function getOrderedHalfDaySlotsForWeek(week) {
    var startSlotId = getWeekStartSlotId(week);
    var startIndex = halfDaySlots.findIndex(function (slot) {
      return slot.id === startSlotId;
    });
    if (startIndex === -1) {
      startIndex = 0;
    }
    var orderedSlots = [];
    for (var i = 0; i < HALF_DAY_SLOTS_PER_WEEK; i += 1) {
      var index = startIndex + i;
      if (index >= halfDaySlots.length) {
        break;
      }
      orderedSlots.push(halfDaySlots[index]);
    }
    return orderedSlots;
  }

  function getHalfDaySlotIndex(slotId) {
    if (typeof slotId !== 'string' || !slotId) {
      return -1;
    }
    var candidate = slotId;
    if (!Object.prototype.hasOwnProperty.call(halfDaySlotIndexMap, candidate)) {
      if (legacySlotIdMap[candidate]) {
        candidate = legacySlotIdMap[candidate];
      }
    }
    if (Object.prototype.hasOwnProperty.call(halfDaySlotIndexMap, candidate)) {
      return halfDaySlotIndexMap[candidate];
    }
    return -1;
  }

  function getOrderedHalfDaySlotIndicesForHalfDay(halfDay) {
    var normalizedHalfDay = normalizeHalfDay(halfDay);
    var startSlotId = weekStartSlotByHalfDay[normalizedHalfDay];
    var startIndex = getHalfDaySlotIndex(startSlotId);
    if (startIndex === -1) {
      startIndex = 0;
    }
    var indices = [];
    for (var i = 0; i < HALF_DAY_SLOTS_PER_WEEK; i += 1) {
      var index = startIndex + i;
      if (index >= halfDaySlots.length) {
        break;
      }
      indices.push(index);
    }
    if (indices.length === 0 && halfDaySlots.length > 0) {
      indices.push(0);
    }
    return indices;
  }

  function getActivitySlotOrderIndices(activities) {
    var indices = [];
    var seen = {};
    if (!Array.isArray(activities)) {
      return indices;
    }
    activities.forEach(function (activity) {
      if (!activity || typeof activity !== 'object') {
        return;
      }
      var normalizedSlot = normalizeSlotId(activity.slot);
      activity.slot = normalizedSlot;
      var index = getHalfDaySlotIndex(normalizedSlot);
      if (index === -1 || seen[index]) {
        return;
      }
      seen[index] = true;
      indices.push(index);
    });
    indices.sort(function (a, b) {
      return a - b;
    });
    return indices;
  }

  function findInsertionIndex(sortedArray, value) {
    if (!Array.isArray(sortedArray) || sortedArray.length === 0) {
      return 0;
    }
    for (var i = 0; i < sortedArray.length; i += 1) {
      if (value < sortedArray[i]) {
        return i;
      }
    }
    return sortedArray.length;
  }

  function remapActivitiesSlotOrder(activities, sourceOrder, targetOrder) {
    if (!Array.isArray(activities) || activities.length === 0) {
      return;
    }
    if (!Array.isArray(targetOrder) || targetOrder.length === 0) {
      return;
    }
    var normalizedSource =
      Array.isArray(sourceOrder) && sourceOrder.length > 0
        ? sourceOrder.slice()
        : getActivitySlotOrderIndices(activities);
    if (normalizedSource.length === 0) {
      normalizedSource.push(targetOrder[0]);
    }
    normalizedSource.sort(function (a, b) {
      return a - b;
    });
    var inserted = {};
    var lastTargetIndex = targetOrder.length - 1;
    activities.forEach(function (activity) {
      if (!activity || typeof activity !== 'object') {
        return;
      }
      var normalizedSlot = normalizeSlotId(activity.slot);
      activity.slot = normalizedSlot;
      var slotIndex = getHalfDaySlotIndex(normalizedSlot);
      if (slotIndex === -1) {
        slotIndex = normalizedSource[0];
      }
      var relativePosition = normalizedSource.indexOf(slotIndex);
      if (relativePosition === -1) {
        relativePosition = findInsertionIndex(normalizedSource, slotIndex);
        if (!inserted[slotIndex]) {
          normalizedSource.splice(relativePosition, 0, slotIndex);
          inserted[slotIndex] = true;
        }
      }
      if (relativePosition < 0) {
        relativePosition = 0;
      }
      if (relativePosition > lastTargetIndex) {
        relativePosition = lastTargetIndex;
      }
      var mappedIndex = targetOrder[relativePosition];
      if (typeof mappedIndex !== 'number') {
        mappedIndex = targetOrder[lastTargetIndex];
      }
      if (typeof mappedIndex !== 'number') {
        mappedIndex = targetOrder[0];
      }
      var mappedSlot = halfDaySlots[mappedIndex];
      activity.slot = mappedSlot ? mappedSlot.id : defaultSlotId;
    });
  }

  function remapWeekActivitiesForHalfDay(week, sourceOrder) {
    if (!week || !Array.isArray(week.activities)) {
      return;
    }
    var targetOrder = getOrderedHalfDaySlotIndicesForHalfDay(week.startHalfDay);
    remapActivitiesSlotOrder(week.activities, sourceOrder, targetOrder);
    refreshWeekActivitiesDates(week);
  }

  function synchronizeWeekActivitiesWithStartHalfDay(week) {
    if (!week || !Array.isArray(week.activities)) {
      return;
    }
    var sourceOrder = getActivitySlotOrderIndices(week.activities);
    remapWeekActivitiesForHalfDay(week, sourceOrder);
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
    return normalizeWeekStartDate(validDates[0]);
  }

  function generateCourseId() {
    return 'course-' + Math.random().toString(36).slice(2, 6) + Date.now().toString(36);
  }

  function generateId() {
    return 'act-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  }
})();
