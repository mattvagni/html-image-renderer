

### Proof of concept to quickly generate images at different sizes based on little 'pages' with dynamic data.

The idea is that this could be useful, maybe, one day, to avoid having to write nasty email html & instead use images for some dynamic content. This is **not** clever/quick enough to be used in the front-end but probably fine for emails since email load times are not such a big deal.

---

### Setup
    npm install -g phantomjs
    npm install
    node app.js --help

---

### Previewing & Rendering Templates
Open http://localhost:3000 to see a list of available templates.

Template previewing urls follow this structure:

    /html/:template_name/

If you want to pass additional information on to your templates (i.e. dynamic data) just append it to the url using query strings (i.e `?name=matt&foo=bar`)

So, for example, `/html/foo/?name=matt` would render `/templates/foo/index.html` with `{ name : 'matt' }`

---

### Creating Templates

Just create a folder within `templates/images` with a single index.html. Make sure it's responsive since the screenshots can be generated at *any* size.

---

### API

Creating images can be done directly in an image tag using specific url structure.

The url structure for generating images is:

    /image/:image_width/:image_height/:template_name/?foo=bar

This will return an image in your specified width and height created by rendering the template in the specified template name.

If the template you are rendering to as an image accepts dynamic data, like when previewing templates, you can just append a query string with your dynamic data.

---

### 'Scaling'

To handle more requests you can spin up multiple instances of phantomjs by passing a list of ports on which you'd like to run them on. For example, if you want to have 5 phantomjs servers: ```node app.js 6000 6001 6002```

---

### TO-DO
- Improve error handling and reporting from the phantomjs process.
