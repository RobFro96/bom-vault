import logging
import os

import pysftp

from bom_vault_config import BomVaultConfig

WEBSITE_FOLDER = "website"


class BomVaultSFTP:
    def __init__(self, config: BomVaultConfig):
        self.config = config

    def start_sync(self):
        cnopts = pysftp.CnOpts()
        cnopts.hostkeys = None

        if self.config.sftp_hostname is None:
            logging.warning("SFTP server not configured, no file upload")
            return

        if self.config.sftp_password is None:
            password = input(
                f"Enter password for {self.config.sftp_user}@{self.config.sftp_hostname}: ")
        else:
            password = self.config.sftp_password

        with pysftp.Connection(self.config.sftp_hostname, port=self.config.sftp_port,
                               username=self.config.sftp_user, password=password, cnopts=cnopts) as sftp:
            self.sync_upload_folder(sftp, WEBSITE_FOLDER, self.config.sftp_path)
        logging.info("SFTP sync complete")

    def sync_upload_folder(self, sftp: pysftp.Connection, local_dir: str, remote_dir: str):
        if not sftp.exists(remote_dir):
            sftp.mkdir(remote_dir)
            logging.info(f"Created remote directory: {remote_dir}")

        sftp.chdir(remote_dir)

        for item in os.listdir(local_dir):
            local_item = os.path.join(local_dir, item)

            if os.path.isfile(local_item):
                # Check if file exists and compare size to avoid redundant uploads
                if not sftp.exists(item) or os.path.getsize(local_item) != sftp.stat(item).st_size:
                    logging.info(f"Uploading: {item}")
                    sftp.put(local_item, item, preserve_mtime=True)

            elif os.path.isdir(local_item):
                # Recursive call for subdirectories
                self.sync_upload_folder(sftp, local_item, item)
                sftp.chdir('..')  # Move back up after recursion
