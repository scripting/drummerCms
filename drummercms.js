var myVersion = "0.4.9", myProductName = "drummerCms";   

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
	defaultTemplate: "http://scripting.com/code/drummercms/template/index.html",
	appDomain: "oldschool.scripting.com", //10/12/21 by DW
	s3BasePath: "/oldschool.scripting.com/", //10/12/21 by DW
	s3BaseUrl:  "http://oldschool.scripting.com/", //10/12/21 by DW
	specialOutlines: { //9/4/21 by DW
		changenotes: {
			urlBlogOpml: "http://drummer.scripting.com/davewiner/drummer/changeNotes.opml",
			basePath: "/scripting.com/drummer/blog/",
			baseUrl: "http://scripting.com/drummer/blog/"
			}
		}
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
function initBlogConfig (blogName, urlOpml, basePath, baseUrl, theOutline, callback) {
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
	var urlAboutOpml = getValueFromOpmlHead ("urlAboutOpml", undefined); //10/18/21 by DW
	var timeZoneOffset = getValueFromOpmlHead ("timeZoneOffset", undefined); //10/13/21 by DW
	
	baseUrl = getValueFromOpmlHead ("urlBlogWebsite", baseUrl); //10/13/21 by DW
	if (!utils.endsWith (baseUrl, "/")) { //10/14/21 by DW
		baseUrl += "/";
		}
	
	var flOldSchoolUseCache = getValueFromOpmlHead ("flOldSchoolUseCache", false);
	if (theConfig === undefined) {
		oldschoolConfig.blogs [blogName] = {
			basePath,   
			basePathItems: basePath + "items/",
			baseUrl, //10/12/21 by DW
			title,
			link: baseUrl, //10/12/21 by DW
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
			appDomain: config.appDomain,
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
			urlAboutOpml, //10/18/21 by DW
			flGoogleAnalytics: false,
			flAlwaysBuildHomePage: true, //8/23/21 by DW
			flOldSchoolUseCache, //8/30/21 by DW
			timeZoneOffset //10/13/21 by DW
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
		theConfig.urlAboutOpml = urlAboutOpml; //10/18/21 by DW
		theConfig.baseUrl = baseUrl; //10/20/21 by DW
		theConfig.timeZoneOffset = timeZoneOffset; //10/20/21 by DW
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
	var urlBlogOpml, basePath, baseUrl, whenstart = new Date ();
	if (config.specialOutlines [blogName] !== undefined) {
		urlBlogOpml = config.specialOutlines [blogName].urlBlogOpml;
		basePath = config.specialOutlines [blogName].basePath;
		baseUrl = config.specialOutlines [blogName].baseUrl;
		}
	else {
		urlBlogOpml = "http://drummer.scripting.com/" + blogName + "/blog.opml";
		basePath = config.s3BasePath + blogName + "/"; //10/12/21 by DW
		baseUrl = config.s3BaseUrl + blogName + "/"; //10/12/21 by DW
		}
	
	getBlogOutline (urlBlogOpml, function (err, theOutline) {
		if (err) {
			const message = "Can't build the blog for \"" + blogName + "\" because blog.opml doesn't exist in Drummer, or is private.";
			callback ({message});
			}
		else {
			initBlogConfig (blogName, urlBlogOpml, basePath, baseUrl, theOutline, function (theConfig) {
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
