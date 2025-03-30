"""Modify 2FA fields for encryption

Revision ID: encrypt_2fa_fields
Create Date: 2023-10-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'encrypt_2fa_fields'
down_revision = None  # Replace with your previous migration if needed
branch_labels = None
depends_on = None


def upgrade():
    # 1. Alter the two_factor_secret column to TEXT to accommodate longer encrypted values
    op.alter_column('user', 'two_factor_secret',
                    existing_type=sa.String(32),
                    type_=sa.String(255),
                    existing_nullable=True)
    
    # 2. Change backup_codes from JSON to TEXT for encrypted JSON
    op.alter_column('user', 'backup_codes',
                    existing_type=sa.JSON(),
                    type_=sa.Text(),
                    existing_nullable=True)


def downgrade():
    # Revert the changes
    op.alter_column('user', 'backup_codes',
                    existing_type=sa.Text(),
                    type_=sa.JSON(),
                    existing_nullable=True)
    
    op.alter_column('user', 'two_factor_secret',
                    existing_type=sa.String(255),
                    type_=sa.String(32),
                    existing_nullable=True) 