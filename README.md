tollan-client
=============

Front-end library for developing Tollan applications. Development supported by [Leonine Publishers](http://leoninepublishers.com/).

Tollan is an architecture for isomorphic websites and applications centered around events and components with an opinion about every aspect of your code's organization. It draws inspiration from the following:

- [Flux](https://facebook.github.io/flux/) - Architecture by Facebook for SPA applications centered around events and a uni-directional data flow.
- [http://martinfowler.com/eaaDev/EventSourcing.html](Event-sourcing) - All data is stored as a sequence of events. Projections read these events and build summaries of the site's current state.
- [Command Query Responsibility Segregation](http://martinfowler.com/bliki/CQRS.html) - The idea of separating your API's commands, which cause events, with queries, which only retreive data. This is in contrast to REST where everything is represented as an object or collection.
- Progressive Enhancement - Websites should at least partially work on older browsers. Search engines, text-only browsers, and screen readers should not have to jump through hoops.
- Component-based - Everything is a component. Each major section of your website should be a separate module. Each block of content should be a separate module. Separate by concerns, not by programming language.

Currently this architecture and related modules are still under heavy development and should not be used, although it is being used in internal projects right now. Further documentation is upcoming.

Getting Started
---------------

See the Tollan Example Project (tollan-example) for an example project.

Tollan is not currently published in npm, use `npm link` instead:

- Clone Tollan to your computer
- run `npm link` in the Tollan folder
- run `npm link tollan-client` in your project folder

Related Modules
---------------

- `tollan-contact`: Present a contact form to your users, and email form submissions to any email address.
- `tollan-blog`: Simple blog module
- `tollan-filemanager`: Upload and manage groups of files
- `tollan-gulp`: Build tools

Documentation
-------------

TODO

Tests
-----

TODO

Roadmap
-------

Roadmap is currently kept in an internal document

License
-------

	   Copyright 2014-2015 Paul Rayes

	   Licensed under the Apache License, Version 2.0 (the "License");
	   you may not use this file except in compliance with the License.
	   You may obtain a copy of the License at

	       http://www.apache.org/licenses/LICENSE-2.0

	   Unless required by applicable law or agreed to in writing, software
	   distributed under the License is distributed on an "AS IS" BASIS,
	   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	   See the License for the specific language governing permissions and
	   limitations under the License.
