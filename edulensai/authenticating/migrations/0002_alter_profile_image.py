
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authenticating', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='image',
            field=models.ImageField(default='profile_pics/user.jpg', upload_to='profile_pics'),
        ),
    ]
