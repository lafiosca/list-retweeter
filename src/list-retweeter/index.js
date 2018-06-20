'use strict';

const _ = require('lodash');
const Twit = require('twit');
const { lambda } = require('nice-lambda');

const listSlug = process.env.TwitterListSlug;

const T = new Twit({
	consumer_key: process.env.TwitterConsumerKey,
	consumer_secret: process.env.TwitterConsumerSecret,
	access_token: process.env.TwitterAccessToken,
	access_token_secret: process.env.TwitterAccessTokenSecret,
});

let screenName = null;

const fetchScreenName = async () => {
	if (screenName) {
		console.log(`Returning cached screen name ${screenName}`);
		return screenName;
	}

	console.log('Fetching screen name from Twitter');

	const options = {
		include_entities: false,
		skip_status: true,
	};

	return T.get('account/verify_credentials', options)
		.then(resp => resp.data)
		.then((data) => {
			screenName = _.get(data, 'screen_name', null);
			console.log(`Cached screen name ${screenName}`);
			return screenName;
		});
};

const fetchStatuses = async () => {
	const ownerScreenName = await fetchScreenName();

	console.log(`Fetching statuses from ${ownerScreenName}'s list ${listSlug}`);

	const options = {
		owner_screen_name: ownerScreenName,
		slug: listSlug,
		count: 60,
		include_entities: false,
		include_rts: false,
	};

	return T.get('lists/statuses', options)
		.then(resp => resp.data);
};

const requestRetweets = statuses =>
	statuses.filter(status => !status.retweeted)
		.map(status => status.id_str)
		.map(id => T.post('statuses/retweet/:id', { id })
			.then(() => true)
			.catch((error) => {
				console.error(`Failed to retweet id ${id}: ${error.message}`);
				return false;
			}));

const requestFavorites = statuses =>
	statuses.filter(status => !status.favorited)
		.map(status => status.id_str)
		.map(id => T.post('favorites/create', { id })
			.then(() => true)
			.catch((error) => {
				console.error(`Failed to favorite id ${id}: ${error.message}`);
				return false;
			}));

const getStats = results =>
	_.reduce(
		results,
		(s, v) => {
			s[v ? 'success' : 'failure'] += 1;
			return s;
		},
		{ success: 0, failure: 0 }
	);

const execute = async () => {
	const statuses = await fetchStatuses();
	console.log(`Examining ${statuses.length} statuses`);

	const originals = statuses.filter(status =>
		(!status.is_quote_status
		&& status.in_reply_to_status_id === null));

	console.log(`Filtered to ${originals.length} original statuses`);

	const retweets = requestRetweets(originals);
	const favorites = requestFavorites(originals);

	console.log(`Retweeting ${retweets.length} statuses and favoriting ${favorites.length} statuses`);

	const retweetResults = await Promise.all(retweets);
	const favoriteResults = await Promise.all(favorites);

	const retweetStats = getStats(retweetResults);
	const favoriteStats = getStats(favoriteResults);

	console.log(`Successful retweets: ${retweetStats.success}`);
	console.log(`Failed retweets: ${retweetStats.failure}`);
	console.log(`Successful favorites: ${favoriteStats.success}`);
	console.log(`Failed favorites: ${favoriteStats.failure}`);
};

exports.handler = lambda(execute);

