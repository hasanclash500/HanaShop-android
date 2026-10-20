# HanaShop Android project

پروژه آماده ساخت APK اندروید با GitHub Actions است.

**راهنمای فارسی بارگذاری و دریافت APK:** [`README-GITHUB-FA.md`](README-GITHUB-FA.md)

- ساخت خودکار: تب `Actions` → گردش‌کار `Build HanaShop APK`
- فایل خروجی در بخش `Artifacts` با نام `HanaShop-debug-APK` قرار می‌گیرد.
- آزمون‌های JavaScript قبل از ساخت APK اجرا می‌شوند.
- ساخت آنلاین از Gradle نصب‌شده روی runner استفاده می‌کند و به `gradle-wrapper.jar` موجود در پروژه اولیه وابسته نیست.
