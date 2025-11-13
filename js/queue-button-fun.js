// The following functions integrate an user interface with multiple queue
// buttons with Glia SDK.

var queueTicket; // Reference to an ongoing QueueTicket. Used for cancellation.

// Bind clicks on queue buttons with Glia SDK
function listenForQueueButtonClicks(salemove, queues) {
  findAllQueueMediaButtons().forEach(function(mediaButton) {
    // Gather properties from UI element
    var buttonQueueName = getMediaButtonQueueName(mediaButton);
    var buttonMedium = getButtonMedium(mediaButton);
    // Find queue ID by matching the queue name to button queue name
    var queueId = queues
      .filter(function(queue) {
        return queue.name === buttonQueueName;
      })
      .map(function(queue) {
        return queue.id;
      })[0];

    if (queueId === undefined) {
      throw new Error(
        'Queue button present, but queue not defined in Glia. Queue name: ' +
          buttonQueueName
      );
    }

    // Queue upon button click
    mediaButton.addEventListener('click', function() {
      if (buttonMedium === 'phone') {
        // Read the visitor's phone number from a separate UI element or from
        // another information source.
        var visitorPhoneNumber = '+1111111111';
        salemove
          .queueForEngagement(buttonMedium, {
            queueId: queueId,
            phoneNumber: visitorPhoneNumber
          })
          .catch(showFailedToQueueView);
      } else {
        salemove
          .queueForEngagement(buttonMedium, {queueId: queueId})
          .catch(showFailedToQueueView);
      }
    });
  });
}

// Bind click on cancel button with QueueTicket cancellation
function listenForCancel() {
  findCancelButton().addEventListener('click', function() {
    if (queueTicket) {
      queueTicket.cancel();
    } else {
      throw new Error('Cannot cancel queuing while not queued');
    }
  });
}

// Handle queue state changes for a particular queue.
// Enable queuing and media buttons for available media if open, disable
// otherwise.
function onQueueState(queue) {
  if (findQueueElement(queue.name) === null) {
    // Queue not related to the current page, ignore
  } else if (queue.state.status === queue.state.STATUSES.OPEN) {
    showCanQueue(findQueueElement(queue.name), queue.state.medias);
    console.log(queue.name + " is online");
  } else {
    showCannotQueue(findQueueElement(queue.name));
    console.log(queue.name + " is offline");
  }
}

// Handle general visitor queuing state changes.
// Adapt this function to match your desired user interface.
// Note that these changes are for a particular visitor and must not conflict
// with the state that is written in `onQueueState` listener. Here two
// different dimensions, disabled and hidden, are used to avoid conflicts.
function onVisitorQueueingState(queuingState) {
  // Disable queuing if visitor is already queued.
  if (queuingState.state === queuingState.QUEUE_STATES.QUEUED) {
    queueTicket = queuingState.ticket;
    findAllQueueElements().forEach(hide);
    show(findCancelButton());
    showAlreadyQueuedView();
  } else if (queuingState.state === queuingState.QUEUE_STATES.CANNOT_QUEUE) {
    // Disable queueing when queueing state changed to `CANNOT_QUEUE`
    // which can happen due do various reasons.
    // See the full list of possible transition reasons in our JS SDK
    // https://sdk-docs.glia.com/visitor-js-api/current/class/AggregateQueueState.html#TRANSITION_REASONS-variable
    queueTicket = null;
    findAllQueueElements().forEach(hide);
    hide(findCancelButton());
    showCannotQueueView();
  } else {
    // Enable queuing otherwise
    queueTicket = null;
    findAllQueueElements().forEach(show);
    hide(findCancelButton());
    showCanQueueView();
  }
}

// Initial state: Cannot queue and cannot cancel
showCannotQueueAnywhere();
hide(findCancelButton());

// Get Glia SDK and bind listeners.
sm.getApi({version: 'v1'}).then(function(salemove) {
  salemove.addEventListener(
    salemove.EVENTS.QUEUE_STATE_UPDATE,
    // onVisitorQueueingState
  );
  listenForCancel();

  salemove.getQueues().then(function(queues) {
    listenForQueueButtonClicks(salemove, queues);

    var queueIds = queues.map(function(queue) {
      return queue.id;
    });
    salemove.subscribeToQueueStateUpdates(queueIds, onQueueState);
  });
});