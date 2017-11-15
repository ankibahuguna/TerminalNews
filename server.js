'use strict';
// TODO add an option to restrict the  number of items to be fetched in one go

const FeedParser = require('feedparser')
const request = require('request');
const cheerio = require('cheerio');
const WordWrap = require('word-wrap');
const prompt = require("prompt");
const htmlToText = require('html-to-text');
const colors = require('colors');
const clear = require('./clear');
const mainUrl = "http://www.thehindu.com/";

let subCat = "";
let limit = null;
let skip = 0;

const cmdArguments = process.argv.slice(0);
const lastArgument = cmdArguments[cmdArguments.length-1];


const columnWidth = 150;

if( cmdArguments && cmdArguments.length>3)
{
	let prefix = cmdArguments[2];

	if(prefix!=='opinion')
	{
		subCat = mainUrl +"news/"+prefix+"/"
	}
	else
	{
		subCat= mainUrl+"opinion/";
	}

}
else
{
	subCat= mainUrl;
}

if(cmdArguments.length>=3 || !isNaN(lastArgument))
{
	limit = parseInt(lastArgument);
}

const feedUrl = subCat+"?service=rss";
const url =feedUrl;

const feedparser = new FeedParser();
const urls = new Map();

let $ = null;


const req = request(url)
req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');

req.setHeader('accept', 'text/html,application/xhtml+xml');

req.on('error', function (error) 
{
		//setTimeout(()=>getList(),10);
		console.error(error);
});

req.on('response', function (res) 
{
	const stream = this;

	if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

	stream.pipe(feedparser);
});





feedparser.on('error', function(error) 
{
  	console.log(error);
});

let i = 0;

feedparser.on('readable', function() 
{
  
  let stream = this, meta = this.meta, item;
  
  while (item = stream.read()) 
  {
	  	urls.set(++i,{
			  link : item.link,
			  title : item.title,
			  description :item.description
		  });
  }

});

feedparser.on('end',function()
{
	renderList()
})

function renderList() {

	const mapKeys = [...urls.keys()].slice(skip,(limit||urls.keys().length));

	for (let i = 0;i<mapKeys.length;i++) {
		
		const value = urls.get(mapKeys[i]);

		process.stdout.write(WordWrap(value.title.bold.blue,{width: columnWidth}));process.stdout.write("  [ "+mapKeys[i]+" ] ")
		
		console.log("\n");

		(value.description)&&console.log(WordWrap(value.description.italic.yellow,{width: columnWidth}))
		
		console.log("\n\n");
	}
	promptForPost();
}

function showNews(body) {
	$ = cheerio.load(body);
	
	let textContent = '';
	let title =$('h1.title').text();
	let mainDivId = "content-body-";
	let idOFDidv = ""

	$("div.article").children().each(function()
	{
		let idString = $(this).attr("id");
		
		if(idString)
		{
			if(idString.indexOf(mainDivId)>-1)
			{
				idOFDidv = idString.trim();
			}
		}
	})
	
	$('#'+idOFDidv).each(function(){
		textContent = textContent +$(this).html()
	});
	
	
	const text = htmlToText.fromString( textContent, 
	{
		wordwrap: 230,
		preserveNewlines:true
	});
			
	console.log(WordWrap(title.bold.white,{width: columnWidth}))
	console.log("\n");
	console.log(WordWrap(text.italic.yellow,{width: columnWidth}));
}

function getNews(url)
{

	sendHttpRequest(url,(error,response,body)=>{
		if(error) {
			
			if(error.code =='ENOTFOUND'){
				getNews(url);
			}
		}
		else {
			showNews(body);
			promptForPost();
		}
	})
}

function sendHttpRequest(url,callback) {

	request(url,(error,response,body) => callback(error,response,body))
}

function promptForPost()
{
	prompt.start();

	let keys = [...urls.keys()];

	keys[keys.length]=0;

	keys = keys.map( v => v.toString());

	keys.push('b');
	keys.push('more');

	let schema = 
	{
		"properties":  
		 {
		    "post":
		     {

			 	message			: 	"Invalid input!!!! Please enter a valid post number,'b' to re-render the list, 0 to exit.",

			 	description		: 	"Enter post number( or  0 to exit)",

			 	enum 			: 	 keys
		 	 }
		  }
  
	}
   	prompt.get(schema,function(err,res)
   	{
   		if(res.post == 0)
   		{
   			process.exit();
		}
		else if(res.post == 'b'){
			renderList();
		}
		else if(res.post =='more'){
		
			skip = limit;
			limit = limit+limit;
			
			clear();
			renderList();
		}
   		else
   		{
   			
	   		let url = urls.get(parseInt(res.post));

	   		clear();

	   		getNews(url.link);
	   			
   		}

   	})
}


// process.on('SIGINT', function(c) {
// 	console.log('c cide',c)
//         process.exit();
// });
