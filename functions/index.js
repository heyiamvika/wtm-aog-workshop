// Import the Dialogflow module and response creation dependencies
// from the Actions on Google client library.
const { dialogflow, Permission } = require('actions-on-google');
const functions = require('firebase-functions');

const cities = require('./cities.js');

// Instantiate the Dialogflow client.
const app = dialogflow({ debug: true });

app.intent('Default Welcome Intent', conv => {
	conv.ask(
		new Permission({
			permissions: 'NAME',
		}),
	);
});

app.intent('dialogflow_permission', (conv, params, permissionGranted) => {
	if (!permissionGranted) {
		conv.ask('Okay, as you wish. ');
	} else {
		const userName = conv.user.name.display;
		conv.ask(`Hello, ${userName}! Nice to see you. `);
	}

	conv.ask('Wanna play a game?');
});

app.intent('Game Start', conv => {
	conv.ask(
		'Let me explain you rules: you start with the last letter of my city. For example: I say "New York", you say "Kyiv", then I say "Vilnius". Let us start: name any city',
	);
});

app.intent('Game cancel', conv => {
	conv.ask('Sure, I am always here for you');
});

app.intent('Game turn', (conv, { 'geo-city': city }) => {
	const userCity = cities.find(item => item.city === city);

	if (userCity.checked) {
		conv.ask(
			`Ooops, I think we already had ${
				userCity.city
			} in this game. Try another one!`,
		);
	} else {
		userCity.checked = true;
		const lastLetter = userCity.city[userCity.city.length - 1];
		const assistantCitiesArray = cities.filter(
			item => !item.checked && item.city.toLowerCase().startsWith(lastLetter),
		);
		if (assistantCitiesArray.length > 0) {
			// If assistant has a city to respond with
			assistantCitiesArray[0].checked = true;

			conv.ask(
				`Your last letter is ${lastLetter}. My city is ${
					assistantCitiesArray[0].city
				}. Your turn!`,
			);
		} else {
			// If assistant lost
			conv.ask(`Wow! Looks like we have a winner!`);
		}
	}
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
