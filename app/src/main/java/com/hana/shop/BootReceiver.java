package com.hana.shop;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restore scheduled reminders after reboot, update and clock or timezone changes. */
public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent != null) {
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                    || Intent.ACTION_TIME_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
                NotificationScheduler.schedule(context);
                NotificationScheduler.maybeNotifyTodaysBirthdays(context);
            }
        }
    }
}
