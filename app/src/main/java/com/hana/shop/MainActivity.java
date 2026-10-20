package com.hana.shop;

import android.app.AlertDialog;
import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends AppCompatActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private ActivityResultLauncher<Intent> pick;
    private ActivityResultLauncher<String> askNotificationPermission;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        askNotificationPermission = registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
            if (granted && web != null) web.evaluateJavascript("window.syncPhoneAlerts&&syncPhoneAlerts()", null);
            if (!granted) toast("برای اعلان تولد و یادآوری، مجوز اعلان را فعال کنید");
        });
        web = new WebView(this);
        setContentView(web);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST).addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e) { toast("برنامه‌ای برای باز کردن این لینک نیست"); }
                return true;
            }
        });
        pick = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), res -> {
            if (chooser != null) { chooser.onReceiveValue(android.webkit.WebChromeClient.FileChooserParams.parseResult(res.getResultCode(), res.getData())); chooser = null; }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(msg).setCancelable(false).setPositiveButton("باشه", (d, w) -> r.confirm()).show();
                return true;
            }
            @Override public boolean onJsConfirm(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(msg).setCancelable(false)
                        .setPositiveButton("تأیید", (d, w) -> r.confirm()).setNegativeButton("انصراف", (d, w) -> r.cancel()).show();
                return true;
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = cb;
                try { pick.launch(p.createIntent()); } catch (Exception e) { chooser = null; return false; }
                return true;
            }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                web.evaluateJavascript("(function(){var d=document.querySelector('dialog[open]');if(d){d.close();return 1}return 0})()",
                        v -> { if (!"1".equals(v)) finish(); });
            }
        });
        if (b == null) web.loadUrl("https://" + HOST + "/assets/www/index.html");
        else web.restoreState(b);
    }

    @Override protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.syncPhoneAlerts&&syncPhoneAlerts()", null);
    }

    @Override protected void onPause() { super.onPause(); if (web != null) web.evaluateJavascript("window.autoBackup&&autoBackup()", null); }

    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }

    private void toast(String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show()); }
    private static String safe(String n) { String r = n == null ? "file" : n.replaceAll("[\\\\/:*?\"<>|]", "_"); return r.isEmpty() ? "file" : r; }

    private class Bridge {
        @JavascriptInterface public void syncNotifications(String json) {
            try { NotificationScheduler.sync(MainActivity.this, json); }
            catch (Exception e) { toast("برنامه‌ریزی اعلان ممکن نشد: " + e.getMessage()); }
        }
        @JavascriptInterface public boolean notificationsEnabled() {
            return NotificationScheduler.notificationsAllowed(MainActivity.this);
        }
        @JavascriptInterface public void requestNotifications() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33 && !NotificationScheduler.notificationsAllowed(MainActivity.this))
                    askNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS);
                else { toast("اعلان‌های برنامه فعال است"); web.evaluateJavascript("window.syncPhoneAlerts&&syncPhoneAlerts()", null); }
            });
        }
        @JavascriptInterface public boolean exactAlarmEnabled() {
            return NotificationScheduler.exactEnabled(MainActivity.this);
        }
        @JavascriptInterface public void requestExactAlarms() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !NotificationScheduler.exactEnabled(MainActivity.this)) {
                    try { startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                            Uri.parse("package:" + getPackageName()))); }
                    catch (Exception e) { toast("از تنظیمات گوشی، مجوز آلارم دقیق را فعال کنید"); }
                } else toast("اعلان‌های دقیق فعال هستند");
            });
        }

        @JavascriptInterface public boolean saveFile(String name, String b64, String type) {
            try {
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                String n = safe(name);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, n);
                    cv.put(MediaStore.Downloads.MIME_TYPE, type == null || type.isEmpty() ? "application/octet-stream" : type);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (u == null) throw new Exception("ذخیره ممکن نشد");
                    try (OutputStream os = getContentResolver().openOutputStream(u)) { if (os == null) throw new Exception("فایل باز نشد"); os.write(data); }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                    if (dir == null) throw new Exception("پوشهٔ فایل در دسترس نیست");
                    try (FileOutputStream os = new FileOutputStream(new File(dir, n))) { os.write(data); }
                }
                toast("ذخیره شد: " + n + (Build.VERSION.SDK_INT >= 29 ? " (پوشهٔ Download)" : " (پوشهٔ اختصاصی برنامه)"));
                return true;
            } catch (Exception e) { toast("خطا در ذخیرهٔ فایل: " + e.getMessage()); return false; }
        }
        @JavascriptInterface public void shareFile(String name, String b64, String mime, String text) {
            try {
                File dir = new File(getCacheDir(), "share"); dir.mkdirs();
                File f = new File(dir, safe(name));
                try (FileOutputStream os = new FileOutputStream(f)) { os.write(Base64.decode(b64, Base64.DEFAULT)); }
                Uri u = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", f);
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(mime == null || mime.isEmpty() ? "*/*" : mime);
                i.putExtra(Intent.EXTRA_STREAM, u);
                if (text != null && !text.isEmpty()) i.putExtra(Intent.EXTRA_TEXT, text);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> startActivity(Intent.createChooser(i, "اشتراک‌گذاری")));
            } catch (Exception e) { toast("خطا در اشتراک‌گذاری: " + e.getMessage()); }
        }
        @JavascriptInterface public boolean hasBiometric() {
            return BiometricManager.from(MainActivity.this).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS;
        }
        @JavascriptInterface public void authenticate() {
            runOnUiThread(() -> {
                if (!hasBiometric()) { bio(false); return; }
                BiometricPrompt p = new BiometricPrompt(MainActivity.this, ContextCompat.getMainExecutor(MainActivity.this), new BiometricPrompt.AuthenticationCallback() {
                    @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) { bio(true); }
                    @Override public void onAuthenticationError(int code, CharSequence msg) { bio(false); }
                });
                p.authenticate(new BiometricPrompt.PromptInfo.Builder().setTitle("باز کردن برنامه").setNegativeButtonText("استفاده از رمز")
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK).build());
            });
        }
        private void bio(boolean ok) { web.evaluateJavascript("window.__bio&&window.__bio(" + ok + ")", null); }
        @JavascriptInterface public void printPage() {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                pm.print("فاکتور", web.createPrintDocumentAdapter("invoice"), new PrintAttributes.Builder().build());
            });
        }
    }
}
