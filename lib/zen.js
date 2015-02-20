'use strict';

module.exports = function() {
	var things = [
		// Adapted from The Zen of Python by Tim Peters, Public Domain
		// http://legacy.python.org/dev/peps/pep-0020/
		'Beautiful is better than ugly.',
		'Explicit is better than implicit.',
		'Simple is better than complex.',
		'Flat is better than nested.',
		'Readability counts.',
		'Special cases aren\'t special enough to break the rules.',
		'Practicality beats purity.',
		'In the face of ambiguity, refuse the temptation to guess.',
		'There should be one-- and preferably only one --obvious way to do it.',
		'Now is better than never, although never is often better than *right* now.',
		'If the implementation is hard to explain, it\'s a bad idea.',

		// Adapted from The Zen of GitHub
		'Responsive is better than fast.',
		'It\'s not fully shipped until it feels fast.',
		'Approachable is better than simple.',
		'Mind your words, they are important.',
		'Speak like a human.',
		'Non-blocking is better than blocking.',
		'Favor focus over features.',
		'Avoid administrative distraction.',
		'Design for failure.',
		'Keep it logically awesome.',

		// These are original ones
		'If you ever forget where something is, it is not in a logical place.',
		'Beauty should always be a goal.',
		'If you ever wait for a test to run, it is too slow.',
		'Question everything.',
		'Seek harmony between code and coder.',
		'Everything must be maintained.',
		'Simplicity is its own reward.',
		'Search not for the most advanced option, but the simplest.',
		'Document everything.',
		'The fastest line of code is the line that is never run.'
	];

	return things[Math.floor(Math.random() * things.length)];
};
