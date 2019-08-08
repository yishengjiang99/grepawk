package com.grepawk;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.*;
import java.util.ArrayList;
import java.util.HashMap;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.helper.Validate;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

/**
 * Hello world!
 *
 */
class LinkInfo {
	public int level;
	public String fromUrl;
	public String url;
	public String text;
	HashMap<String, String> meta = new HashMap<String, String>();

	public LinkInfo(String url, String text, int level) {
		this.level = level;
		this.url = url;
		this.text = text;
	}
	public String toString() {
		JSONObject obj = new JSONObject();
		obj.put("from", fromUrl);
		obj.put("to", url);
		obj.put("text", text);
		return obj.toString();
	}
	public String toQueueString() {
		JSONObject obj = new JSONObject();
		obj.put("url", url);
		obj.put("level", level);
		return obj.toString();
		
	}
}

class PageInfo {
	public String url;
	public String title;
	HashMap<String, String> headers = new HashMap<String, String>();
	HashMap<String, String> meta = new HashMap<String, String>();

	public PageInfo(String url, String title) {
		this.url = url;
		this.title = title;
	}

	public String toString() {
		JSONObject obj = new JSONObject();
		obj.put("url", url);
		obj.put("title", title);
		obj.put("headers", new JSONObject(headers));
		obj.put("meta", new JSONObject(meta));
		return obj.toString();
	}
}

public class App {
	private static void print(String msg, Object... args) {
		System.out.println(String.format(msg, args));
	}

	private static void postJSON(String urlString, String jsonString, String dataType) throws IOException {
		  String charset = "UTF-8"; 
		  URLConnection connection = new URL(urlString).openConnection();
		  connection.setRequestProperty("x-data-type", dataType);
		  connection.setDoOutput(true); // Triggers POST.
		  connection.setRequestProperty("Accept-Charset", charset);
		  connection.setRequestProperty("Content-Type", "application/json;charset=" + charset);
		  try (OutputStream output = connection.getOutputStream()) {
		    output.write(jsonString.getBytes(charset));
		  }
		  InputStream response = connection.getInputStream();
		  //System.out.println(response.toString());
	
	}

	public static void parseUrl(String url, int level) {

		try {
			ArrayList<LinkInfo> linkInfos = new ArrayList<LinkInfo>();
			Document doc = Jsoup.connect(url).get();
			Element title = doc.selectFirst("title");
			PageInfo info = new PageInfo(url, title.text());
			Elements links = doc.select("a[href]");
			Elements h5 = doc.select("h5");
			print(title.text());
			postJSON("https://grepawk.com/data", info.toString(),"pageInfo");
			for (Element link : links) {
				LinkInfo infoLink = new LinkInfo(link.attr("abs:href"), link.text(), level + 1);
				infoLink.fromUrl=url;
				postJSON("https://grepawk.com/data", infoLink.toString(),"link");
				postJSON("https://grepawk.com/queue/send", infoLink.toQueueString(),"link");

				print(" * a: <%s>  (%s)", link.attr("abs:href"), link.text());
			}
			

		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static void run() {
		try {
			InputStream in = new URL("https://grepawk.com/queue/receive").openStream();
			String jsonTxt = IOUtils.toString(in, "UTF-8");
			JSONArray array = new JSONArray(jsonTxt);
			for (int i = 0; i < array.length(); i++) {
				JSONObject obj = array.getJSONObject(i);
				String url = obj.getString("url");
				int level = obj.getInt("level");
				parseUrl(url, level);
			}
		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	public static void main(String[] args) {

		run();
		print("done");

	}
}
