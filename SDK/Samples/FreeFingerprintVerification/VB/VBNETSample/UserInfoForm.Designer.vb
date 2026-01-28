Namespace VBNETSample
	Partial Class UserInfoForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		Protected Overloads Overrides Sub Dispose(ByVal disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.btnClose = New System.Windows.Forms.Button()
			Me.lblUserName = New System.Windows.Forms.Label()
			Me.pbUserFinger = New System.Windows.Forms.PictureBox()
			DirectCast((Me.pbUserFinger), System.ComponentModel.ISupportInitialize).BeginInit()
			Me.SuspendLayout()
			' 
			' btnClose
			' 
			Me.btnClose.Anchor = ((System.Windows.Forms.AnchorStyles.Bottom Or System.Windows.Forms.AnchorStyles.Right))
			Me.btnClose.DialogResult = System.Windows.Forms.DialogResult.Cancel
			Me.btnClose.Location = New System.Drawing.Point(356, 527)
			Me.btnClose.Name = "btnClose"
			Me.btnClose.Size = New System.Drawing.Size(75, 23)
			Me.btnClose.TabIndex = 0
			Me.btnClose.Text = "Close"
			Me.btnClose.UseVisualStyleBackColor = True
			' 
			' lblUserName
			' 
			Me.lblUserName.Anchor = (((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right))
			Me.lblUserName.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D
			Me.lblUserName.Location = New System.Drawing.Point(4, 6)
			Me.lblUserName.Name = "lblUserName"
			Me.lblUserName.Size = New System.Drawing.Size(427, 23)
			Me.lblUserName.TabIndex = 1
			Me.lblUserName.Text = "label1"
			Me.lblUserName.TextAlign = System.Drawing.ContentAlignment.MiddleCenter
			' 
			' pbUserFinger
			' 
			Me.pbUserFinger.Anchor = ((((System.Windows.Forms.AnchorStyles.Top Or System.Windows.Forms.AnchorStyles.Bottom) Or System.Windows.Forms.AnchorStyles.Left) Or System.Windows.Forms.AnchorStyles.Right))
			Me.pbUserFinger.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D
			Me.pbUserFinger.Location = New System.Drawing.Point(4, 32)
			Me.pbUserFinger.Name = "pbUserFinger"
			Me.pbUserFinger.Size = New System.Drawing.Size(427, 489)
			Me.pbUserFinger.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage
			Me.pbUserFinger.TabIndex = 2
			Me.pbUserFinger.TabStop = False
			' 
			' UserInfoForm
			' 
			Me.AcceptButton = Me.btnClose
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0F, 13.0F)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.CancelButton = Me.btnClose
			Me.ClientSize = New System.Drawing.Size(436, 562)
			Me.Controls.Add(Me.pbUserFinger)
			Me.Controls.Add(Me.lblUserName)
			Me.Controls.Add(Me.btnClose)
			Me.MinimizeBox = False
			Me.Name = "UserInfoForm"
			Me.ShowIcon = False
			Me.ShowInTaskbar = False
			Me.Text = "User Information"
			DirectCast((Me.pbUserFinger), System.ComponentModel.ISupportInitialize).EndInit()
			Me.ResumeLayout(False)

		End Sub

#End Region

		Private btnClose As System.Windows.Forms.Button
		Private lblUserName As System.Windows.Forms.Label
		Private pbUserFinger As System.Windows.Forms.PictureBox
	End Class
End Namespace
