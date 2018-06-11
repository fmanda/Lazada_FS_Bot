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

const user = '7.sourcecode@gmail.com'
const password = 'fmasecret1'
const paymentmethod = 'COD';
//COD; Mandiri; BCA; dst, ,hati2 case sensitive

//bot akan meloop proses FS sejumlah array dibawah,
//misal ingin 2x proses produk yg sama, inputkan 2x di array dibawah dengan format {name:'name',url:'url'}
const products = [
	{name:'5A Grey', url:'https://www.lazada.co.id/products/xiaomi-mi-power-bank-10000mah-silver-i160040604-s181911598.html'}
	// {name:'5A Gold', url:'https://www.lazada.co.id/products/xiaomi-redmi-5a-gold-snapdragron-425-quad-core-i160043545-s181917409.html'}
]

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
	console.log('login user ');
	await page.goto(loginurl, { waitUntil: 'networkidle2' })
	await page.click('input[type="text"]')
	await page.keyboard.type(user)
	await page.click('input[type="password"]')
	await page.keyboard.type(password);
	await page.click('button[type="submit"]')
	await page.waitForNavigation();
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
				await Promise.all( [button.click(), page.waitForSelector(dialog_cart_selector,{timeout : 3000}) ])
			}catch(err){
				console.log(err);
				await clearCart(page);
				continue;
			}
			break;
		}catch(err){
			console.log(product.name + ' : Gagal Tambah ke Troli, Refresh Halaman Product')
			console.log(err)
		}
	}
}

async function doPayment(page, product){
	console.log(product.name + ' : proses pembayaran');
	while (true){
		try{
			await page.goto(carturl, { waitUntil: 'networkidle2' });

			var button = (await page.$x('//button[contains(.,"LANJUTKAN KE PEMBAYARAN")]'))[0];
			await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			var button = (await page.$x('//button[contains(.,"LANJUTKAN KE PEMBAYARAN")]'))[0];
			await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			if (paymentmethod == 'COD'){
				var button = (await page.$x('//div[.="Bayar di Tempat"]'))[0];
				await Promise.all([ button.click(), page.waitForSelector('div.checkbox-list.item-content') ]);
			}else{
				var button = (await page.$x('//div[.="melalui bank transfer"]'))[0];
				await Promise.all([ button.click(), page.waitForSelector('div.checkbox-list.item-content') ]);

				var button = (await page.$x('//p[contains(@class, "bank-name") and text() = "'+ paymentmethod + '"]'))[0];
				await button.click()
			}

      // var button = (await page.$x('//button[contains(.,"BUAT PESANAN SEKARANG")]'))[0];
			// await Promise.all([ button.click(), page.waitForNavigation({ waitUntil: 'networkidle2' }) ]);

			break;
		}catch(err){
			console.log(product.name + ' : Gagal proses pembayaran')
		}
	}
}

try {
	(async () => {
		const browser = await puppeteer.launch({
			headless: false,  /*userDataDir: newchromeprofile,executablePath: chromepath*/
		})
		const page = await browser.newPage()
		await page.setViewport({ width: 0, height: 0 })
		await login(page)

		for (var product of products){
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
