

### Proof of concept to quickly generate images at different sizes based on little 'pages' with dynamic data.

The idea is that this could be useful, maybe, one day, to avoid having to write nasty email html & instead use images for some dynamic content. This is **not** clever/quick enough to be used in the front-end but probably fine for emails since email load times are not such a big deal.

---

### Setup
    npm install -g phantomjs
    npm install
    node app.js

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

### Creating images

Creating images can be done directly in an image tag using specific url structure.

The url structure for generating images is:

    /image/:image_width/:image_height/:template_name/

This will return an image in your specified width and height created by rendering the template in the specified template name.

If the template you are rendering to as an image accepts dynamic data, like when previewing templates, you can just append a query string with your dynamic data.

---

### So called 'Caching'
When an image has been created it is stored in the 'image-store' folder.
The folder structure structure is such that the first level is the package.json version number, the second level is the requested size (width x height) and the third level is a hash of the provided template data.

Before firing up phantomjs to generate an image, it checks whether you have the image already in which case it just returns it.

This means that you must bump the version when you want to invalidate the cache/make any global css changes that could effect any templates.

After a while, this is what your image-store should look like:

    - 0.0.1
        - 200x200
            - foo
                - 7c20f3372ef740c4eb08ca56f44335a5.jpeg
                - d41d8cd98f00b204e9800998ecf8427e.jpeg
                - etc...
        - 400x500
            - foo
                - d41d8cd98f00b204e9800998ecf8427e.jpeg
                - etc...

    - 0.0.2
        - 200x200
            - foo
                - 7c20f3372ef740c4eb08ca56f44335a5.jpeg
                - d41d8cd98f00b204e9800998ecf8427e.jpeg
                - etc...
        - 400x500
            - foo
                - d41d8cd98f00b204e9800998ecf8427e.jpeg
                - etc...

---

### TO-DO
- Improve error handling and reporting from the phantomjs process.
