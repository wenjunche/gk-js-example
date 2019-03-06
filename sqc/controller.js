//// Direct connection example

function transcriptionReceived(code, data) {  
  try {
  	dataObject = JSON.parse(data);
  	if ('result' in dataObject) {
			try {
				if (dataObject.result.interpreted_quote) {
						const entities = parseInterpretedQuote(dataObject.result.interpreted_quote);
						if (entities.length > 0) {
							$('#JSONoutput').html(JSON.stringify(entities, null, 2));
						} else {
							$('#JSONoutput').html(JSON.stringify(dataObject, null, 2));
						}
				} else {
					$('#JSONoutput').html(JSON.stringify(dataObject, null, 2));
				}

				if ('hypotheses' in dataObject.result) {
					if ('clean_transcript' in dataObject.result.hypotheses[0]) {
						$('#transcriptOutput').text(dataObject.result.hypotheses[0].clean_transcript)
					} else {
						$('#transcriptOutput').text(dataObject.result.hypotheses[0].transcript)
					}
				}
			}
			catch (parseErr) {
				console.error(parseErr);
			}
		}
	}
  catch (err) {
    console.log(data);
  }
}

function parseInterpretedQuote(interpretedQuote) {
	let entities = [];
	if (interpretedQuote) {
		parseEntity(interpretedQuote.product, entities, "product");
		parseEntity(interpretedQuote.terms, entities, "terms");
		parseEntity(interpretedQuote.bid, entities, "bid");
		parseEntity(interpretedQuote.ask, entities, "ask");
	}
	return entities;
}

function parseEntity(entity, entities, entityName) {
	if (Array.isArray(entity)) {
		entities.push({entityName, value: entity.join()});
	} else {
		entities.push({entityName, value: entity});
	}
}

//// Direct connection example
/*
function transcriptionReceived(code, data) {
  try {
  	dataObject = JSON.parse(data);
  	if ('result' in dataObject) {
  		socket.send(JSON.stringify({token: "XC7WFVC3UW3HPQRV5YUR", message: dataObject, endpoint: "/" + $('#gktPin').val()}));
  	}
  }
  catch (err) {
  	console.log(data)
  }
}

function readSocket() {
  var msg_socket = new WebSocket($('#gktWSSServer').attr('address') + $('#gktPin').val());

  msg_socket.onopen = function() {
    console.log("connected");
  }

  msg_socket.onclose = function(e) {
    console.log("connection closed (" + e.code + ")");
  }

  msg_socket.onmessage = function(e) {
    if (e.data.length > 0) {
	  	console.log("received message: " + e.data);
			var dataObject = JSON.parse(e.data);
      $('#JSONoutput').html(JSON.stringify(dataObject, null, 2));
			
			if ('hypotheses' in dataObject.result) {
				if ('clean_transcript' in dataObject.result.hypotheses[0]) {
					$('#transcriptOutput').text(dataObject.result.hypotheses[0].clean_transcript)
				} else {
					$('#transcriptOutput').text(dataObject.result.hypotheses[0].transcript)
				}
			}
    }
  }

}

socketInit();
*/
var isConnected = false;
var tt = new Transcription();

var dictate = null;
var socket;

var interpreted_quote = null;
var raw_transcript = null;

// Public methods (called from the GUI)
function toggleListening() {
	if (isConnected) {
		dictate.cancel();
    $('#gktStop').hide();
    $('#gktStart').show();
	} else {
		dictate.startListening();
    $('#gktStart').hide();
    $('#gktStop').show();
	}
}

function cancel() {
	dictate.cancel();
}

function socketInit() {
  socket = new WebSocket($('#gktWSSServer').attr('address') + $('#gktPin').val());

  socket.onopen = function() {
    console.log("publish connected");
  }

  socket.onclose = function(e) {
    console.log("publish connection closed (" + e.code + ")");
  }
}

dictate = new Dictate({
		server : $("#gktServer").attr('address') + "speech",
		serverStatus : $("#gktServer").attr('address') + "status",
		recorderWorkerPath : $('#gktRecorderWorker').attr('address'),
		onReadyForSpeech : function() {
			isConnected = true;
			__message("READY FOR SPEECH");
		},
		onEndOfSpeech : function() {
			__message("END OF SPEECH");
			$('#buttonStop').hide();$('#buttonStart').show();
		},
		onEndOfSession : function() {
			isConnected = false;
			__message("END OF SESSION");
			$('#buttonStop').hide();$('#buttonStart').show();
		},
		onServerStatus : function(json) {
			__serverStatus(json.num_workers_available);
		},
		onPartialResults : function(hypos) {
		},
		onResults : function(hypos) {
		},
		onError : function(code, data) {
			dictate.cancel();
			__error(code, data);
		},
		onEvent : function(code, data) {
			__message(code, data);
		}
});

dictate.init();

// Private methods (called from the callbacks)
function __message(code, data) {
	console.log("msg: " + code + ": " + (data || ''));
  transcriptionReceived(code, data)
}

function __error(code, data) {
	console.log("ERR: " + code + ": " + (data || ''));
  $('#gktStop').hide();
  $('#gktStart').show();
}

function __serverStatus(msg) {
	console.log(msg);
}