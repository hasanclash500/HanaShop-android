package com.hana.shop;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.icu.util.ULocale;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

/** Offline notification scheduling. Dates of individual tasks arrive as local epoch milliseconds.
 *  Customer birthdays are checked daily using Android's PersianCalendar so they recur each year. */
public final class NotificationScheduler {
    private static final String PREF = "hana_phone_notifications";
    private static final String EVENTS = "events";
    private static final String LAST_BIRTHDAY = "last_birthday";
    private static final String CHANNEL = "hana_tasks_v1";
    static final String TASK = "com.hana.shop.REMINDER";
    static final String BIRTHDAY = "com.hana.shop.BIRTHDAYS";
    private static final int BIRTHDAY_CODE = 734100;
    private NotificationScheduler() {}

    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREF, Context.MODE_PRIVATE); }
    private static JSONObject data(Context c) {
        try { return new JSONObject(prefs(c).getString(EVENTS, "{}")); }
        catch (Exception e) { return new JSONObject(); }
    }
    private static AlarmManager alarm(Context c) { return (AlarmManager) c.getSystemService(Context.ALARM_SERVICE); }
    private static PendingIntent pending(Context c, String id) {
        Intent intent = new Intent(c, NotificationReceiver.class);
        intent.setAction(TASK);
        intent.setData(Uri.parse("hana://reminder/" + Uri.encode(id)));
        intent.putExtra("id", id);
        return PendingIntent.getBroadcast(c, id.hashCode() & 0x7fffffff, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    private static PendingIntent birthdayIntent(Context c) {
        Intent intent = new Intent(c, NotificationReceiver.class).setAction(BIRTHDAY);
        return PendingIntent.getBroadcast(c, BIRTHDAY_CODE, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    private static void putAlarm(Context c, long when, PendingIntent pi) {
        AlarmManager m = alarm(c);
        if (m == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !m.canScheduleExactAlarms()) {
            // Works without the special exact-alarm permission; Android may defer delivery.
            m.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
            return;
        }
        try { m.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi); }
        catch (SecurityException e) { m.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi); }
    }
    public static boolean exactEnabled(Context c) {
        AlarmManager m = alarm(c);
        return m != null && (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || m.canScheduleExactAlarms());
    }
    public static boolean notificationsAllowed(Context c) {
        return Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }
    public static void sync(Context c, String json) throws Exception {
        JSONObject next = new JSONObject(json);
        if (!(next.opt("birthdays") instanceof JSONArray) || !(next.opt("reminders") instanceof JSONArray)) throw new Exception("دادهٔ اعلان نامعتبر است");
        JSONObject previous = data(c);
        JSONArray old = previous.optJSONArray("reminders");
        if (old != null) for (int i = 0; i < old.length(); i++) {
            JSONObject r = old.optJSONObject(i);
            if (r != null) alarm(c).cancel(pending(c, r.optString("id", "")));
        }
        if (!prefs(c).edit().putString(EVENTS, json).commit()) throw new Exception("ذخیرهٔ اعلان‌ها ناموفق بود");
        schedule(c);
        maybeNotifyTodaysBirthdays(c);
    }
    public static void schedule(Context c) {
        JSONObject all = data(c);
        JSONArray tasks = all.optJSONArray("reminders");
        long now = System.currentTimeMillis();
        if (tasks != null) for (int i = 0; i < tasks.length(); i++) {
            JSONObject r = tasks.optJSONObject(i);
            if (r == null) continue;
            String id = r.optString("id", "");
            long when = r.optLong("when", 0);
            if (!id.isEmpty() && when > now) putAlarm(c, when, pending(c, id));
        }
        scheduleBirthdays(c);
    }
    public static void scheduleBirthdays(Context c) {
        Calendar at = Calendar.getInstance();
        at.set(Calendar.HOUR_OF_DAY, 9);
        at.set(Calendar.MINUTE, 0);
        at.set(Calendar.SECOND, 0);
        at.set(Calendar.MILLISECOND, 0);
        if (at.getTimeInMillis() <= System.currentTimeMillis()) at.add(Calendar.DAY_OF_MONTH, 1);
        putAlarm(c, at.getTimeInMillis(), birthdayIntent(c));
    }
    public static void maybeNotifyTodaysBirthdays(Context c) {
        Calendar now = Calendar.getInstance();
        if (now.get(Calendar.HOUR_OF_DAY) >= 9) notifyBirthdays(c);
    }
    public static void notifyBirthdays(Context c) {
        if (!notificationsAllowed(c)) return;
        android.icu.util.Calendar now = android.icu.util.Calendar.getInstance(new ULocale("fa_IR@calendar=persian"));
        int year = now.get(android.icu.util.Calendar.YEAR);
        int month = now.get(android.icu.util.Calendar.MONTH) + 1;
        int day = now.get(android.icu.util.Calendar.DAY_OF_MONTH);
        String today = year + "/" + month + "/" + day;
        if (today.equals(prefs(c).getString(LAST_BIRTHDAY, ""))) return;
        JSONArray birthdays = data(c).optJSONArray("birthdays");
        if (birthdays == null) return;
        StringBuilder names = new StringBuilder();
        int count = 0;
        for (int i = 0; i < birthdays.length(); i++) {
            JSONObject b = birthdays.optJSONObject(i);
            if (b == null || b.optInt("month") != month || b.optInt("day") != day) continue;
            if (count < 6) { if (names.length() > 0) names.append("، "); names.append(b.optString("name", "مشتری")); }
            count++;
        }
        if (count == 0) return;
        String message = count <= 6 ? names.toString() : names + " و " + (count - 6) + " مشتری دیگر";
        show(c, "تولد " + count + " مشتری امروز 🎂", message, "birthdays");
        prefs(c).edit().putString(LAST_BIRTHDAY, today).apply();
    }
    public static void notifyTask(Context c, String id) {
        if (!notificationsAllowed(c) || id == null) return;
        JSONArray tasks = data(c).optJSONArray("reminders");
        if (tasks == null) return;
        for (int i = 0; i < tasks.length(); i++) {
            JSONObject task = tasks.optJSONObject(i);
            if (task != null && id.equals(task.optString("id"))) {
                show(c, "یادآوری فروشگاه", task.optString("title", "کار فروشگاه"), "task:" + id);
                return;
            }
        }
    }
    private static void show(Context c, String title, String body, String tag) {
        NotificationManager manager = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "تولدها و یادآوری‌های فروشگاه", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("تولد مشتریان و کارهای برنامه‌ریزی‌شده فروشگاه حنا");
            manager.createNotificationChannel(channel);
        }
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openApp = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(c, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title).setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(openApp).setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).build();
        manager.notify(tag, 1, notification);
    }
}
