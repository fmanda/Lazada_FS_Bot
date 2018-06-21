//yg login masih pakai google, silahkan di forget password biar dibuatkan password lazada
//login dengan google blm tak set pakai bot ini karena butuh cookies
//Lazada tidak menggunakan #id di element nya, jadi selector pakai caption (xpath) & css class
//sesuaikan selector apabila kelak lazada ada update interface

//ket :
//1. proses login
//2. clear existing cart item
//3. go to product url, refresh smpai bisa ditambahkan ke TROLI
//4. tambahkan ke TROLI & checkout
//5. pembayaran, sukses loop ke step no 2 sejumlah products array

var config_file_name = '';
if (process.argv[2]) {
	config_file_name = process.argv[2];
}else{
	throw	"Parameter config tidak didefinisikan"
}
var cfg = require('./' + config_file_name);

// console.log(cfg);
// return;

const puppeteer = require('puppeteer')
const loginurl = 'https://member.lazada.co.id/user/login'
const carturl = 'https://cart.lazada.co.id/cart'

// silahkan aktif kan di puppeteer.launch parameter jika ingin menggunakan browser & existing profile yg telah terinstall
// const chromepath = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
// const newchromeprofile = 'C:/Users/fmanda/AppData/Local/Google/Chrome/User Data/'

const dialog_cart_selector = '#dialog-body-1'
const btn_del_cart = 'span.lazada.lazada-ic-Delete.lazada-icon.icon.delete';
const xpath_del_cart = '//button[contains(.,"HAPUS")]'

async function login(page){
	// while (true){ //locked account
	// 	try{
			console.log('login user ');
			await page.goto(loginurl, { waitUntil: 'networkidle2' })
			await page.click('input[type="text"]')
			await page.keyboard.type(cfg.user)
			await page.click('input[type="password"]')
			await page.keyboard.type(cfg.password);
			await page.click('button[type="submit"]')
			await page.waitForNavigation();
			// break;
		// }catch(err){
		// 	console.log(err);
		// }
	// }

}

async function checkCart(page){
	console.log('Check cart');
	await page.goto(carturl, { waitUntil: 'networkidle2' });
	const delexists = !!(await page.$(btn_del_cart));
	return delexists; //sudah ada di cart
}

async function clearCart(page){
	console.log('Reset cart');
	while (true){
		try{
			await page.goto(carturl, { waitUntil: 'networkidle2' });
			const delexists = !!(await page.$(btn_del_cart));
			if (!delexists) break;
			await Promise.all( [page.click(btn_del_cart), page.waitForXPath(xpath_del_cart,{timeout : 3000}) ])
			var button = (await page.$x(xpath_del_cart))[0];
			await button.click()
		}catch(err){
			// console.log(err)
		}
	}
}

async function addToCart(page, product){
	console.log(product.name + ' : add to cart');
	while (true){
		try{
			await page.goto(product.url, { waitUntil: 'networkidle2' })
			var button = (await page.$x('//button[contains(.,"TAMBAH KE TROLI")]'))[0];
			if (!button) {continue;}
			try{
				await Promise.all( [button.click(), page.waitForSelector(dialog_cart_selector,{timeout : 30000}) ])
				console.log("cek cart");
				if (await checkCart(page)){ //jika sudah ada di cart, lanjut payment
					console.log("cek cart break");
					break;
				}else{
					console.log("cek cart continue");
					continue; //proses ulang					
				}
				//testing
				// throw	"test exception"

			}catch(err){
				console.log(err);
				if (await checkCart(page)){ //jika sudah ada di cart, lanjut payment
					break;
				}else{
					continue; //proses ulang
				}
				// await clearCart(page);
			}
			break;
		}catch(err){
			console.log(product.name + ' : Gagal Tambah ke Troli, Check Cart')
			console.log(err)
		}
	}
}

async function doPayment(page, product){
	console.log(product.name + ' : proses pembayaran');
	while (true){
		try{
			await page.goto(carturl, { waitUntil: 'networkidle2' });
			//check cart

			var button = (await page.$x('//button[contains(.,"LANJUTKAN KE PEMBAYARAN")]'))[0];
			await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			var button = (await page.$x('//button[contains(.,"LANJUTKAN KE PEMBAYARAN")]'))[0];
			await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			if (cfg.paymentmethod == 'COD'){
				var button = (await page.$x('//div[contains(@class, "pay-method-item") and contains(., "di Tempat")]'))[0];
				await Promise.all([ button.click(), page.waitForSelector('div.btn-place-order-wrap') ]);
				// await button.click()
			}else{
				var button = (await page.$x('//div[.="melalui bank transfer"]'))[0];
				await Promise.all([ button.click(), page.waitForSelector('div.checkbox-list.item-content') ]);

				var button = (await page.$x('//p[contains(@class, "bank-name") and text() = "'+ cfg.paymentmethod + '"]'))[0];
				await button.click()
			}
			var button = (await page.$x('//button[contains(.,"BUAT PESANAN SEKARANG")]'))[0];
			await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			break;
		}catch(err){
			try{
				var button = (await page.$x('//button[contains(.,"BUAT PESANAN SEKARANG")]'))[0];
				await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);
				break;
			}catch(err2){
			}

			console.log(product.name + ' : Gagal proses pembayaran')
			console.log(err)
		}
	}
}

try {
	// console.log(cfg);
	// return;
	(async () => {
		const browser = await puppeteer.launch({
			headless: false,  /*userDataDir: newchromeprofile,executablePath: chromepath*/
		})
		const page = await browser.newPage()
		await page.setViewport({ width: 0, height: 0 })
		await login(page)

		for (var product of cfg.products){
			console.log('Proses Flash Sale : ' + product.name + ', url : ' + product.url);
			await clearCart(page);
			await addToCart(page, product);
			await doPayment(page, product);
			console.log('Selesai Flash Sale : ' + product.name + ', url : ' + product.url + '\n');
		}
		console.log('Done')
	})()
} catch (err) {
	console.error(err)
}
