var myVersion = "0.4.2", myProductName = "drummerCms";    

const fs = require ("fs");  
const request = require ("request");  
const utils = require ("daveutils");
const davehttp = require ("davehttp");  
const opml = require ("opml"); 
const oldschool = require ("oldschoolblog");

var config = {
	port: process.env.PORT || 1410,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true,
	defaultDescription: "",
	defaultHeaderImage: "http://scripting.com/images/2021/08/02/joeDiMaggio.png",
	defaultCopyright: "",
	defaultTemplate: "http://scripting.com/code/drummercms/template/index.html"
	};
var oldSchoolConfig = {
	flHttpEnabled: false
	};
const fnameConfig = "config.json";

function httpRequest (url, timeout, headers, callback) {
	request (url, function (err, response, data) {
		if (err) {
			callback (err);
			}
		else {
			if (response.statusCode != 200) {
				const message = "The request returned a status code of " + response.statusCode + ".";
				callback ({message});
				}
			else {
				callback (undefined, data) 
				}
			}
		});
	}
function initBlogConfig (blogName, theOutline, callback) {
	var oldschoolConfig = oldschool.getConfig ();
	var theConfig = oldschoolConfig.blogs [blogName];
	function copyAllHeadElements () {
		for (var x in theOutline.opml.head) { //make all values from the head available to the template
			theOutline.opml.head [x] = theOutline.opml.head [x];
			}
		}
	function getValueFromOpmlHead (name, defaultValue) {
		if (theOutline.opml.head [name] === undefined) {
			return (defaultValue);
			}
		else {
			return (theOutline.opml.head [name]);
			}
		}
	var title = getValueFromOpmlHead ("title", blogName + "'s blog");
	var description = getValueFromOpmlHead ("description", config.defaultDescription);
	var copyright = getValueFromOpmlHead ("copyright", config.defaultCopyright);
	var urlHeaderImage = getValueFromOpmlHead ("urlHeaderImage", config.defaultHeaderImage);
	var urlTemplate = getValueFromOpmlHead ("urlTemplate", config.defaultTemplate);
	var urlHomePageTemplate = getValueFromOpmlHead ("urlHomePageTemplate", undefined);
	var urlGlossary = getValueFromOpmlHead ("urlGlossary", undefined);
	if (theConfig === undefined) {
		var basePath = "/oldschool.scripting.com/" + blogName + "/";
		const urlOpml = "http://drummer.scripting.com/" + blogName + "/blog.opml";
		const appDomain = "oldschool.scripting.com";
		oldschoolConfig.blogs [blogName] = {
			basePath,   
			basePathItems: basePath + "items/",
			baseUrl: "http:/" + basePath,
			title,
			link: "http://" + basePath + "/",
			description,
			urlTemplate,
			urlHomePageTemplate,
			urlOpml,
			urlHeaderImage,
			copyright,
			language: "en-us",
			generator: myProductName + " v" + myVersion,
			docs: "http://cyber.law.harvard.edu/rss/rss.html",
			docsForJsonFeed: "https://github.com/scripting/Scripting-News/blob/master/rss-in-json/README.md",
			twitterScreenName: blogName,
			facebookPageName: undefined,
			maxFeedItems: 50,
			appDomain,
			flRssCloudEnabled: true,
			rssCloudDomain: "rpc.rsscloud.io",
			rssCloudPort: 5337,
			rssCloudPath: "/pleaseNotify",
			rssPingPath: "/ping",
			rssCloudRegisterProcedure: "",
			rssCloudProtocol: "http-post",
			maxDaysOnHomePage: 25,
			flUploadItemsToS3: true,
			flIncludeImageInMetadata: true,
			urlGlossaryOpml: urlGlossary,
			flGoogleAnalytics: false,
			flAlwaysBuildHomePage: true //8/23/21 by DW
			};
		theConfig = oldschoolConfig.blogs [blogName];
		copyAllHeadElements ();
		oldschool.initBlog (blogName, function () {
			callback (theConfig);
			});
		}
	else {
		theConfig.title = title;
		theConfig.description = description;
		theConfig.urlTemplate = urlTemplate;
		theConfig.urlHomePageTemplate = urlHomePageTemplate;
		theConfig.urlHeaderImage = urlHeaderImage;
		theConfig.copyright = copyright;
		theConfig.urlGlossaryOpml = urlGlossary;
		copyAllHeadElements ();
		callback (theConfig);
		}
	}
function getBlogOutline (urlBlogOpml, callback) {
	httpRequest (urlBlogOpml, undefined, undefined, function (err, opmltext) {
		if (err) {
			callback (err);
			}
		else {
			opml.parse (opmltext, function (err, theOutline) {
				if (err) {
					callback (err);
					}
				else {
					callback (undefined, theOutline);
					}
				});
			}
		})
	}
function oldschoolBuild (blogName, callback) {
	const whenstart = new Date ();
	const urlBlogOpml = "http://drummer.scripting.com/" + blogName + "/blog.opml";
	getBlogOutline (urlBlogOpml, function (err, theOutline) {
		if (err) {
			const message = "Can't build the blog for \"" + blogName + "\" because blog.opml doesn't exist in Drummer, or is private.";
			callback ({message});
			}
		else {
			initBlogConfig (blogName, theOutline, function (theConfig) {
				console.log ("oldschoolBuild: theOutline.opml.head == " + utils.jsonStringify (theOutline.opml.head));
				var options = {
					blogName
					};
				oldschool.publishBlog (theOutline.opml, options, function (blogConfig) {
					const data = {
						baseUrl: blogConfig.baseUrl,
						ctSecs: utils.secondsSince (whenstart)
						};
					callback (undefined, data);
					});
				});
			}
		});
	}
function handleHttpRequest (theRequest) { 
	const params = theRequest.params;
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnPlainText (s) {
		theRequest.httpReturn (200, "text/plain", s.toString ());
		}
	function returnData (jstruct) {
		if (jstruct === undefined) {
			jstruct = {};
			}
		theRequest.httpReturn (200, "application/json", utils.jsonStringify (jstruct));
		}
	function returnError (jstruct) {
		theRequest.httpReturn (500, "application/json", utils.jsonStringify (jstruct));
		}
	function httpReturn (err, jstruct) {
		if (err) {
			returnError (err);
			}
		else {
			returnData (jstruct);
			}
		}
	switch (theRequest.lowermethod) {
		case "get":
			switch (theRequest.lowerpath) {
				case "/now":
					returnPlainText (new Date ());
					return (true);
				case "/version":
					returnData ({
						productName: myProductName,
						version: myVersion
						});
					return (true);
				case "/build":
					oldschoolBuild (params.blog, httpReturn);
					return;
				}
			break;
		}
	return (false);
	}
function readConfig (fname, config, callback) {
	utils.sureFilePath (fname, function () {
		fs.readFile (fname, function (err, data) {
			if (!err) {
				try {
					var jstruct = JSON.parse (data.toString ());
					for (var x in jstruct) {
						config [x] = jstruct [x];
						}
					}
				catch (err) {
					console.log ("readConfig: err == " + err.message);
					}
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}

oldschool.init (oldSchoolConfig, function () {
	readConfig (fnameConfig, config, function () {
		davehttp.start (config, handleHttpRequest);
		});
	});


