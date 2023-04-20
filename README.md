# drummerCms

A shell for Old School to connect it with Drummer. Released so other outliners can hook up to Old School for blogging.

### Overview

As promised, here's the open source release of drummerCMS. It's the app that gets called when you build a blog from within Drummer. 

It's a small shell for the much larger <a href="https://github.com/scripting/oldSchoolBlog">oldSchoolBlog</a> package to connect it with Drummer. Released so other outliners can hook up to Old School for blogging.

You'll see there's not much there. It builds a config struct for the blog. It can do this because it knows where the user's blog.opml file is located. It would likely be in a different location for another product. 

The heart of the app is <a href="https://github.com/scripting/drummerCms/blob/main/drummercms.js#L40">initBlogConfig</a>. 

An example of a <a href="http://drummer.scripting.com/cluelessnewbie/blog.opml">blog.opml</a> file.

The <a href="https://github.com/scripting/drummerCms">repo</a> is open, use the <a href="https://github.com/scripting/drummerCms/issues">Issues section</a> to discuss. 

### Updates

See the <a href="worknotes.md">worknotes.md</a> page.

