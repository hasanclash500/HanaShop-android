# راهنمای ساخت APK با امضای ثابت HanaShop

این مراحل را **یک بار** با رایانهٔ ویندوزی انجام دهید. هر نسخهٔ بعدی باید با **همان کلید** امضا شود.

## ۱. ساخت کلید خصوصی روی رایانهٔ خودتان
Java JDK 17 را نصب کنید (keytool باید در PATH باشد). در PowerShell، پوشهٔ امنی خارج از پوشهٔ پروژه بسازید و این دستور را اجرا کنید:

```powershell
mkdir "$HOME\Documents\HanaShop-Private"
cd "$HOME\Documents\HanaShop-Private"
keytool -genkeypair -v -keystore hanashop-release.jks -alias hanashop -keyalg RSA -keysize 3072 -validity 10000 -storetype PKCS12
```

دو رمز قوی وارد کنید؛ می‌توانید برای کلید همان رمز keystore را استفاده کنید. هنگام سؤال دربارهٔ نام و مشخصات، اطلاعات خودتان را وارد کنید. رمزها را به ChatGPT، فایل مخزن یا هیچ فردی ارسال نکنید.

فایل `hanashop-release.jks` و رمزها را در یک محل امن **خارج از GitHub** نیز پشتیبان بگیرید. گم‌شدن کلید یعنی دیگر نمی‌توانید به‌روزرسانی را با امضای قبلی منتشر کنید.

## ۲. تبدیل کلید به متن Base64 برای GitHub Secrets
در همان PowerShell:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Documents\HanaShop-Private\hanashop-release.jks")) | Set-Clipboard
```

این دستور متن Base64 را به حافظهٔ کپی می‌کند. آن را در هیچ پیام یا فایل عمومی قرار ندهید.

## ۳. افزودن چهار Secret در GitHub
مخزن → Settings → Secrets and variables → Actions → New repository secret

- `HANASHOP_KEYSTORE_BASE64` : متن Base64 کپی‌شده
- `HANASHOP_STORE_PASSWORD` : رمز keystore
- `HANASHOP_KEY_ALIAS` : `hanashop`
- `HANASHOP_KEY_PASSWORD` : رمز کلید (اگر یکسان است همان رمز keystore)

این موارد در GitHub Secrets ذخیره می‌شوند و workflow کلید را فقط موقتاً روی runner می‌نویسد. به هیچ‌وجه فایل jks را داخل مخزن آپلود نکنید.

## ۴. ساخت نسخهٔ امضاشده
مخزن → Actions → **Build signed HanaShop Release APK** → Run workflow → Run workflow.

بعد از سبز شدن اجرای موفق، در Artifacts فایل `HanaShop-signed-release-APK` را دانلود کنید. داخل ZIP فایل `app-release.apk` قرار دارد.

## حفاظت اطلاعات فعلی
APKهایی که تاکنون با GitHub Actions در حالت **debug** ساخته شدند ممکن است با کلیدهای موقت متفاوت امضا شده باشند. فایل Release با کلید جدید نمی‌تواند روی نسخهٔ Debug با امضای متفاوت نصب شود.

قبل از هرگونه حذف، از داخل HanaShop نسخهٔ JSON کامل بگیرید و روی رایانه نگه دارید؛ فایل را بررسی کنید. اگر تعویض نسخه نیاز به حذف برنامه قبلی داشت، **فقط پس از داشتن پشتیبان معتبر** اقدام کنید و سپس JSON را بازگردانید.

نسخهٔ فعلی release: versionCode=2 و versionName=1.1، package `com.hana.shop`.
برای انتشار بعدی versionCode را بزرگ‌تر کنید ولی کلید امضا و package را ثابت نگه دارید.
